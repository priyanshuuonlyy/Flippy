import * as THREE from '/three.module.js';

/**
 * 3D WebGL Graphics Engine for RGC (Random Gesture Chats)
 * Built with Three.js:
 *  - 3D Extruded Volumetric Glowing Neon Hearts with dynamic physics & tumbling rotation
 *  - Ambient Cyber-Neon Quantum Starfield with 3D depth perspective
 *  - Cinematic Hyperspace Warp effect on skip/partner transition
 *  - Responsive 3D Parallax camera tracking (cursor & touch)
 *  - Auto-throttling & power-saving render loop (reduced motion & visibility aware)
 */
export class RgcVisuals3D {
  constructor(canvas, isReducedMotion = () => false) {
    this.canvas = canvas;
    this.isReducedMotion = isReducedMotion;
    this.active = false;
    this.hearts = [];
    this.stars = null;
    this.warpFactor = 0;
    this.targetWarp = 0;
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.lastTime = performance.now();
    this.startTime = performance.now();

    if (!this.checkWebGL()) {
      console.warn('WebGL unavailable, Three.js 3D layer disabled.');
      return;
    }

    try {
      this.init();
      this.active = true;
      this.animate();
    } catch (err) {
      console.warn('Failed to initialize 3D visuals:', err);
    }
  }

  checkWebGL() {
    try {
      const testCanvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }

  init() {
    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    const rect = this.canvas.getBoundingClientRect();
    const aspect = Math.max(0.1, rect.width / (rect.height || 1));
    this.camera = new THREE.PerspectiveCamera(55, aspect, 1, 1000);
    this.camera.position.set(0, 0, 160);

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(rect.width, rect.height, false);

    // 3. Lighting (Dynamic cyber glow)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    this.scene.add(ambientLight);

    const pinkLight = new THREE.PointLight(0xff007f, 2.5, 400);
    pinkLight.position.set(60, 80, 120);
    this.scene.add(pinkLight);

    const cyanLight = new THREE.PointLight(0x00f0ff, 2.0, 400);
    cyanLight.position.set(-60, -80, 100);
    this.scene.add(cyanLight);

    // 4. Base Geometry for 3D Hearts
    this.heartGeometry = this.buildHeartGeometry();

    // 5. Interactive Parallax Listeners
    window.addEventListener('pointermove', event => {
      this.mouse.targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      this.mouse.targetY = -(event.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    // Resize Observer
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.canvas);
  }

  buildHeartGeometry() {
    // Parametric 2D heart contour
    const shape = new THREE.Shape();
    const s = 0.16; // Scale down to fit 3D units
    shape.moveTo(0 * s, 10 * s);
    shape.bezierCurveTo(-15 * s, 35 * s, -45 * s, 35 * s, -45 * s, 10 * s);
    shape.bezierCurveTo(-45 * s, -12 * s, -25 * s, -30 * s, 0 * s, -50 * s);
    shape.bezierCurveTo(25 * s, -30 * s, 45 * s, -12 * s, 45 * s, 10 * s);
    shape.bezierCurveTo(45 * s, 35 * s, 15 * s, 35 * s, 0 * s, 10 * s);

    const extrudeSettings = {
      depth: 3.5,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 1.5,
      bevelThickness: 1.5
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    return geometry;
  }

  resize() {
    if (!this.active || !this.renderer) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    this.camera.aspect = rect.width / rect.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(rect.width, rect.height, false);
  }

  burst(event = {}) {
    if (!this.active) return;
    const reduced = this.isReducedMotion();
    const count = reduced ? 8 : 26;
    let seed = (event.seed || Math.random() * 100000) >>> 0;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const colorPalette = [
      { color: 0xff1361, emissive: 0xff0055 }, // Hot Neon Pink
      { color: 0xff4081, emissive: 0xe91e63 }, // Magenta Rose
      { color: 0xff0033, emissive: 0xb71c1c }, // Electric Crimson
      { color: 0x9c27b0, emissive: 0x673ab7 }  // Radiant Purple
    ];

    for (let i = 0; i < count; i++) {
      const palette = colorPalette[Math.floor(random() * colorPalette.length)];
      const material = new THREE.MeshPhongMaterial({
        color: palette.color,
        emissive: palette.emissive,
        emissiveIntensity: 0.9,
        specular: 0xffffff,
        shininess: 90,
        transparent: true,
        opacity: 0.95
      });

      const mesh = new THREE.Mesh(this.heartGeometry, material);
      const scale = 0.5 + random() * 1.3;
      mesh.scale.set(scale, scale, scale);

      // Start position (bottom of camera view)
      mesh.position.set(
        (random() - 0.5) * 110,
        -70 - random() * 20,
        (random() - 0.5) * 60
      );

      mesh.rotation.set(
        (random() - 0.5) * 0.8,
        (random() - 0.5) * 0.8,
        (random() - 0.5) * 0.6
      );

      this.scene.add(mesh);

      this.hearts.push({
        mesh,
        material,
        vx: (random() - 0.5) * 0.35,
        vy: 0.6 + random() * 0.85,
        vz: (random() - 0.5) * 0.25,
        rotX: (random() - 0.5) * 0.05,
        rotY: (random() - 0.5) * 0.06,
        rotZ: (random() - 0.5) * 0.03,
        pulseSpeed: 3 + random() * 4,
        pulsePhase: random() * Math.PI * 2,
        life: 0,
        maxLife: 3.5 + random() * 2.5
      });
    }
  }

  warp() {
    if (!this.active) return;
    this.targetWarp = 1.0;
    setTimeout(() => {
      this.targetWarp = 0.0;
    }, 700);
  }

  animate() {
    if (!this.active) return;
    requestAnimationFrame(() => this.animate());

    if (document.hidden) return; // Pause GPU rendering while tab is hidden

    const now = performance.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    const elapsedTime = (now - this.startTime) / 1000;

    // 1. Smooth Camera Parallax Tracking
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
    this.camera.position.x = this.mouse.x * 12;
    this.camera.position.y = this.mouse.y * 9;
    this.camera.lookAt(0, 0, 0);

    // 2. Warp Effect Interpolation (subtle camera depth push on skip)
    this.warpFactor += (this.targetWarp - this.warpFactor) * 0.12;
    this.camera.position.z = 160 - this.warpFactor * 25;

    // If no active hearts, clear canvas and skip render
    if (this.hearts.length === 0 && this.warpFactor < 0.01) {
      this.renderer.clear();
      return;
    }

    // 3. Update 3D Floating Hearts
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const item = this.hearts[i];
      item.life += delta;
      const progress = item.life / item.maxLife;

      if (progress >= 1.0) {
        this.scene.remove(item.mesh);
        item.material.dispose();
        this.hearts.splice(i, 1);
        continue;
      }

      // Physics motion
      item.mesh.position.x += item.vx;
      item.mesh.position.y += item.vy;
      item.mesh.position.z += item.vz;

      // Tumbling rotation
      item.mesh.rotation.x += item.rotX;
      item.mesh.rotation.y += item.rotY;
      item.mesh.rotation.z += item.rotZ;

      // Pulse & Fade
      const pulse = 1 + Math.sin(elapsedTime * item.pulseSpeed + item.pulsePhase) * 0.08;
      item.mesh.scale.multiplyScalar(pulse / (item.lastPulse || 1));
      item.lastPulse = pulse;

      // Fade out at end of life
      if (progress > 0.65) {
        item.material.opacity = Math.max(0, (1 - progress) / 0.35 * 0.95);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.active = false;
    this.resizeObserver?.disconnect();
    this.heartGeometry?.dispose();
    if (this.stars) {
      this.stars.geometry.dispose();
      this.stars.material.dispose();
    }
    for (const item of this.hearts) {
      this.scene.remove(item.mesh);
      item.material.dispose();
    }
    this.renderer?.dispose();
  }
}
