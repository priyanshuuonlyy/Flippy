export const SUPPORTED_LANGUAGES = Object.freeze({
  en: { name: 'English', flag: '🇺🇸', code: 'en' },
  es: { name: 'Español', flag: '🇪🇸', code: 'es' },
  pt: { name: 'Português', flag: '🇧🇷', code: 'pt' },
  tr: { name: 'Türkçe', flag: '🇹🇷', code: 'tr' },
  fr: { name: 'Français', flag: '🇫🇷', code: 'fr' },
  de: { name: 'Deutsch', flag: '🇩🇪', code: 'de' }
});

export const TRANSLATIONS = {
  en: {
    // Navigation
    navConversation: 'Conversation',
    navGestures: 'Gestures',
    navAbout: 'About',
    navSafety: 'Safety',
    navFaq: 'FAQ',
    navSettings: 'Settings',
    privacyNote: 'No server recording',

    // Header & Leave
    eyebrow: 'A LITTLE CONNECTION',
    headerTitle: 'Meet someone new.',
    leaveBtn: 'Leave',

    // Empty state
    stageEyebrow: 'YOUR SPACE TO CONNECT',
    emptyTitle: 'Ready when you are.',
    emptyTitleSearching: 'Finding your next hello…',
    emptyTitleConnecting: 'Making the connection…',
    emptyTitlePaused: 'A moment to reconnect.',
    emptyText: 'Turn on your camera and microphone.<br>A new conversation starts with you.',
    emptyTextSearching: 'Waiting for another camera-ready person. Try a second browser to test.',
    emptyTextPaused: 'Check your camera and microphone, then resume when you’re ready.',
    emptyTextDefault: 'Turn on your camera and microphone to find your next conversation.',
    chooseToConnect: 'You choose when to connect',
    readyStatus: 'Ready when you are',
    handsFreeHint: 'Hands free, naturally',

    // Status & Labels
    labelIdle: 'Ready when you are',
    labelPreview: 'Camera preview · not connected',
    labelSearching: 'Finding someone new…',
    labelConnecting: 'Connecting your conversation…',
    labelChatting: 'You’re connected',
    labelPaused: 'Matching paused',
    labelReconnecting: 'Reconnecting…',

    partnerNext: 'YOUR NEXT CONNECTION',
    partnerLive: 'YOUR NEW CONNECTION',
    previewTag: 'YOUR PREVIEW',
    badgeCameraOff: 'CAMERA OFF',
    badgeCameraOn: 'CAMERA ON',
    roomBadge: 'FLIPPY LIVE',

    // Controls
    btnEnableMedia: 'Enable camera & mic',
    btnFinding: 'Finding your connection…',
    btnConnected: 'Connected',
    btnResume: 'Resume chatting ↗',
    btnStart: 'Start chatting ↗',
    btnNext: 'Next person',
    btnMute: 'Mute',
    btnUnmute: 'Unmute',
    btnSendLove: 'Send love',
    micOff: 'Mic off',
    micOn: 'Mic on',
    micMuted: 'Mic muted',
    micUnavailable: 'Mic unavailable',
    gesturesWaiting: 'Gestures waiting for camera',
    gesturesReady: '✧ Hand gestures ready',

    // Notices
    noticeAllowMedia: 'Allow camera and microphone access in your browser to start a conversation.',
    noticeCheckingCamera: 'Microphone is on. Checking your camera before you connect.',
    noticeConnectedChecking: 'Connected. Checking your camera…',
    noticeReadyWithMic: 'Camera ready. Microphone is on. Start a conversation when you’re ready.',
    noticeReadyNoMic: 'Camera ready, but your microphone is unavailable. Use Restart camera & mic.',
    noticeConnectionLost: 'Connection lost. Reconnecting and checking your camera again…',
    noticeServerUnreachable: 'Could not reach the chat server. Retrying…',
    noticeInterrupted: 'Connection interrupted. Giving it a moment to recover…',
    noticeSayHello: 'Say hello! Two fingers + a sideways swipe finds someone new.',
    noticeCameraDenied: 'Camera or microphone permission was denied. Open your browser’s site permissions, allow both Camera and Microphone, then try again.',
    noticeCameraUnavailable: 'Camera or microphone unavailable. Check your system and browser permissions.',

    // Gesture Guide
    guideTitle1: 'A swipe or snip. A new hello.',
    guideDesc1: 'Hold index + middle fingers together and flick sideways, or snip twice (✂️) in place to skip.',
    guideTitle2: 'A heart, from both hands.',
    guideDesc2: 'Join your fingertips and thumbs. Hold to send a little love.',

    // Settings
    settingsSummary: 'Camera, sound & accessibility',
    langSelectLabel: 'Language / Idioma',
    cameraSelectLabel: 'Camera',
    defaultCamera: 'Default camera',
    dimRoomLabel: 'I’m in a dim room',
    gesturesEnabledLabel: 'Hand gestures enabled',
    reduceMotionLabel: 'Reduce reaction motion',
    restartCameraBtn: 'Restart camera & mic',
    cameraRequirementText: 'Buttons work without gestures. A black or unusable camera pauses matching after two minutes. Improve lighting or restart your camera, then resume.',
    advancedHeading: '⚡ Advanced Features · Gesture Customization',
    scissorLabel: 'Scissor Snip (✂️ open/close fingers twice to skip)',
    swipeLabel: 'Two-finger swipe (horizontal sweep or flick)',
    sensitivityLabel: 'Gesture Sensitivity',
    sensBalanced: 'Balanced (Standard)',
    sensHigh: 'High Sensitivity (Lighter flick)',
    sensStrict: 'Strict (Reduced false triggers)',

    // About Section
    pageTitle: 'Flippy · Free Random Video Chat with Hand Gestures',
    metaDescription: 'Meet new people on Flippy, a free random video chat platform with camera-based gestures and encrypted WebRTC calling. Camera activity checks help maintain video availability.',
    aboutH2: 'Free Random Video Chat, Designed Around Gestures',
    aboutP: 'Flippy is a free browser-based video chat experience for meeting new people. Hand gestures let you move to another conversation or send visual reactions. Camera activity checks help pause unusable video feeds; they do not verify identity or prevent every inappropriate interaction.',
    card1H4: 'Camera-Ready Matching',
    card1P: 'CameraGate checks basic frame activity and lighting before matching. These checks are not identity verification and cannot guarantee that every feed is genuine.',
    card2H4: 'Respectful Conversations',
    card2P: 'Flippy is built for friendly, respectful conversations. Be considerate and avoid sharing personal details with people you have just met.',
    card3H4: 'Touchless Hand Gestures',
    card3P: 'Control your conversation hands-free! A quick two-finger swipe or double scissor snip (✂️) skips immediately to someone new. A two-handed heart (🫶) showers your partner with love reactions.',
    card4H4: 'Completely Free & Private',
    card4P: 'No account or payment is currently required. Calls use encrypted WebRTC; relay servers may assist connectivity. Flippy does not provide a server-side call recording feature.',

    // Safety Section
    safetyH2: 'Community Expectations & Safety Development',
    safetyBadge1: '✓ Camera Activity Checks',
    safetyBadge2: '✓ Respectful Conduct Rules',
    safetyBadge3: '✓ Free Conversations',
    safetyBadge4: '✓ Instant Skip Gesture',
    safetyBadge5: '✓ Peer-to-Peer Encrypted',
    safetyP1: 'Nudity, harassment, coercion and abusive behavior are not welcome on Flippy. Camera activity checks are not a substitute for content moderation. Doer is developing reporting, enforcement and age-appropriate safeguards; these are not yet verified as active protections.',
    safetyH3_1: 'What CameraGate Checks',
    safetyP2: 'Before matching, CameraGate evaluates basic frame activity and lighting. A black, inactive or unusable feed may pause matching. If a conversation makes you uncomfortable, use Next or Leave to disconnect. Identity verification and automatic explicit-content detection are not provided by CameraGate.',
    safetyH3_2: 'Respect for Everyone',
    safetyP3: 'Every user deserves respectful treatment. Random video chat involves strangers, so no platform can guarantee someone’s behavior. Please protect your privacy and disconnect if you encounter unwanted conduct.',

    // FAQ Section
    faqH2: 'Frequently Asked Questions About Flippy',
    faqQ1: 'Is Flippy completely free to use?',
    faqA1: 'Yes! Flippy is 100% free random video chat. There are no paid tiers, subscriptions, coins, credits, or hidden charges. You can enjoy unlimited face-to-face video conversations at zero cost.',
    faqQ2: 'What safety features does Flippy currently have?',
    faqA2: 'CameraGate monitors video activity and can pause matchmaking for unusable feeds. Next and Leave let you exit a conversation. Live content moderation, user reporting, age-appropriate matching and enforcement improvements are being developed; do not assume they already protect every call.',
    faqQ3: 'Can I use Flippy on mobile devices (Android and iPhone)?',
    faqA3: 'Yes! Flippy is fully optimized for mobile browsers, including Chrome on Android and Safari on iOS. No app download is required — simply visit the website on your phone, grant camera and microphone access, and start chatting immediately.',
    faqQ4: 'How do the hand gesture shortcuts work?',
    faqA4: 'Flippy uses on-device computer vision to detect natural gestures: hold your index and middle fingers together and sweep sideways, or snip fingers twice in place like a pair of scissors (✂️) to skip to the next person. Bring your hands together into a heart shape to send floating love balloons.',
    faqQ5: 'Are my video calls or personal details recorded?',
    faqA5: 'Flippy uses encrypted WebRTC connections. When direct connectivity is unavailable, a relay may carry traffic. The current application does not offer server-side call recording. Your conversation partner may still record their screen, so avoid sharing sensitive information.',

    // Footer
    footerTitle: 'Flippy · Random Gesture Chats',
    footerDesc: 'Free random video chat with camera-based gestures. Developed by Doer.',
    footerBeKind: 'Be kind. Stay present. © 2026 Flippy'
  },

  es: {
    // Navigation
    navConversation: 'Conversación',
    navGestures: 'Gestos',
    navAbout: 'Acerca de',
    navSafety: 'Seguridad',
    navFaq: 'Preguntas',
    navSettings: 'Ajustes',
    privacyNote: 'Sin grabación en servidor',

    // Header & Leave
    eyebrow: 'UNA PEQUEÑA CONEXIÓN',
    headerTitle: 'Conoce a alguien nuevo.',
    leaveBtn: 'Salir',

    // Empty state
    stageEyebrow: 'TU ESPACIO PARA CONECTAR',
    emptyTitle: 'Listo cuando tú quieras.',
    emptyTitleSearching: 'Buscando tu próximo saludo…',
    emptyTitleConnecting: 'Estableciendo conexión…',
    emptyTitlePaused: 'Un momento para reconectar.',
    emptyText: 'Enciende tu cámara y micrófono.<br>Una nueva conversación comienza contigo.',
    emptyTextSearching: 'Esperando a otra persona con cámara lista.',
    emptyTextPaused: 'Revisa tu cámara y micrófono, luego reanuda cuando estés listo.',
    emptyTextDefault: 'Enciende tu cámara y micrófono para iniciar tu próxima conversación.',
    chooseToConnect: 'Tú eliges cuándo conectar',
    readyStatus: 'Listo cuando tú quieras',
    handsFreeHint: 'Manos libres, de forma natural',

    // Status & Labels
    labelIdle: 'Listo cuando tú quieras',
    labelPreview: 'Vista previa · no conectado',
    labelSearching: 'Buscando a alguien nuevo…',
    labelConnecting: 'Conectando tu conversación…',
    labelChatting: 'Estás conectado',
    labelPaused: 'Emparejamiento pausado',
    labelReconnecting: 'Reconectando…',

    partnerNext: 'TU PRÓXIMA CONEXIÓN',
    partnerLive: 'TU NUEVA CONEXIÓN',
    previewTag: 'TU VISTA PREVIA',
    badgeCameraOff: 'CÁMARA APAGADA',
    badgeCameraOn: 'CÁMARA ENCENDIDA',
    roomBadge: 'FLIPPY EN VIVO',

    // Controls
    btnEnableMedia: 'Activar cámara y micrófono',
    btnFinding: 'Buscando tu conexión…',
    btnConnected: 'Conectado',
    btnResume: 'Reanudar chat ↗',
    btnStart: 'Iniciar chat ↗',
    btnNext: 'Siguiente persona',
    btnMute: 'Silenciar',
    btnUnmute: 'Activar voz',
    btnSendLove: 'Enviar amor',
    micOff: 'Mic apagado',
    micOn: 'Mic activo',
    micMuted: 'Mic silenciado',
    micUnavailable: 'Mic no disponible',
    gesturesWaiting: 'Esperando cámara para gestos',
    gesturesReady: '✧ Gestos con manos listos',

    // Notices
    noticeAllowMedia: 'Permite el acceso a la cámara y el micrófono en tu navegador para comenzar.',
    noticeCheckingCamera: 'Micrófono encendido. Verificando tu cámara antes de conectar.',
    noticeConnectedChecking: 'Conectado. Verificando tu cámara…',
    noticeReadyWithMic: 'Cámara lista y micrófono encendido. Inicia una conversación cuando desees.',
    noticeReadyNoMic: 'Cámara lista, pero tu micrófono no está disponible. Usa Reiniciar cámara.',
    noticeConnectionLost: 'Conexión perdida. Reconectando y verificando tu cámara…',
    noticeServerUnreachable: 'No se pudo conectar con el servidor. Reintentando…',
    noticeInterrupted: 'Conexión interrumpida. Esperando recuperación…',
    noticeSayHello: '¡Di hola! Desliza dos dedos hacia un lado para encontrar a alguien nuevo.',
    noticeCameraDenied: 'Permiso de cámara o micrófono denegado. Permite ambos en los ajustes de tu navegador.',
    noticeCameraUnavailable: 'Cámara o micrófono no disponibles. Verifica los permisos del sistema.',

    // Gesture Guide
    guideTitle1: 'Un deslizamiento o tijera. Un nuevo hola.',
    guideDesc1: 'Junta los dedos índice y corazón y desliza a un lado, o haz tijera dos veces (✂️) para pasar.',
    guideTitle2: 'Un corazón, con ambas manos.',
    guideDesc2: 'Une las puntas de tus dedos y pulgares. Mantén para enviar un poco de amor.',

    // Settings
    settingsSummary: 'Cámara, sonido y accesibilidad',
    langSelectLabel: 'Idioma / Language',
    cameraSelectLabel: 'Cámara',
    defaultCamera: 'Cámara predeterminada',
    dimRoomLabel: 'Estoy en una habitación oscura',
    gesturesEnabledLabel: 'Gestos con manos activados',
    reduceMotionLabel: 'Reducir movimiento de reacciones',
    restartCameraBtn: 'Reiniciar cámara y micrófono',
    cameraRequirementText: 'Los botones funcionan sin gestos. Una cámara negra o inutilizable pausa el chat tras dos minutos.',
    advancedHeading: '⚡ Funciones avanzadas · Personalización de gestos',
    scissorLabel: 'Corte de tijera (✂️ abrir/cerrar dedos dos veces para pasar)',
    swipeLabel: 'Deslizamiento con dos dedos (barrido horizontal)',
    sensitivityLabel: 'Sensibilidad de gestos',
    sensBalanced: 'Equilibrada (Estándar)',
    sensHigh: 'Alta sensibilidad (Movimiento suave)',
    sensStrict: 'Estricta (Evita falsos toques)',

    // About Section
    aboutH2: 'Videochat Aleatorio Gratis con Personas Reales — Alternativa Limpia a Omegle',
    aboutP: '¿Buscas una web de videochat aleatorio segura y moderna para conocer personas auténticas? Flippy es la plataforma de chat de video de nueva generación diseñada para conexiones humanas reales cara a cara. Olvídate de los bots extraños, pantallas negras y conductas inapropiadas de webs antiguas. En Flippy, cada usuario se verifica en vivo mediante cámara, garantizando charlas con personas amigables en un entorno limpio y respetuoso.',
    card1H4: '100% Rostros Reales y Cero Bots',
    card1P: 'Nuestra tecnología CameraGate requiere una cámara activa e iluminada antes de conectar. Se bloquean videos pregrabados y pantallas negras.',
    card2H4: 'Conversaciones Respetuosas y Seguras',
    card2P: 'Diseñado para quienes realmente quieren conversar: estudiantes, viajeros y gente simpática en busca de interacciones agradables sin contenido explícito.',
    card3H4: 'Gestos sin Tocar la Pantalla',
    card3P: '¡Controla todo sin manos! Un deslizamiento de dos dedos o tijera doble (✂️) pasa a la siguiente persona. Un corazón con dos manos (🫶) envía amor.',
    card4H4: 'Totalmente Gratis y Privado',
    card4P: 'Sin registros, sin números de teléfono ni tarjetas. Llamadas cifradas punto a punto (WebRTC) sin grabaciones en servidores.',

    // Safety Section
    safetyH2: 'Seguridad Comunitaria: Por qué Flippy es Limpio y sin Desnudez',
    safetyBadge1: '✓ Verificación por IA',
    safetyBadge2: '✓ Cero Tolerancia a Desnudez',
    safetyBadge3: '✓ Solo Personas Reales',
    safetyBadge4: '✓ Salto Inmediato por Gestos',
    safetyBadge5: '✓ Cifrado Punto a Punto',
    safetyP1: 'La mayoría de sitios antiguos fallaron porque permitieron conductas vulgares e inapropiadas. Flippy se creó para cambiar esto con una política estricta de cero tolerancia contra desnudez y acoso.',
    safetyH3_1: 'Cómo te Protege Nuestra Puerta de Cámara',
    safetyP2: 'Antes de entrar a la cola, Flippy verifica iluminación, movimiento y actividad de la cámara. Quien apague la cámara o tape el lente es pausado de inmediato.',
    safetyH3_2: 'Un Espacio Seguro para Chicas y Personas Respetuosas',
    safetyP3: 'Si buscas hablar con chicas o personas agradables gratis sin encontrarte con desagradables sorpresas, Flippy es para ti. Mantenemos un ambiente acogedor y seguro.',

    // FAQ Section
    faqH2: 'Preguntas Frecuentes sobre Flippy',
    faqQ1: '¿Flippy es completamente gratis?',
    faqA1: '¡Sí! Flippy es 100% gratis. No hay monedas, suscripciones ni pagos ocultos. Puedes hablar todo el tiempo que quieras sin pagar nada.',
    faqQ2: '¿Cómo evita Flippy a los usuarios inapropiados?',
    faqA2: 'Flippy analiza la actividad de la cámara en tiempo real. Pantallas negras, fotos estáticas y videos falsos son rechazados al instante, expulsando a quienes rompen las normas.',
    faqQ3: '¿Puedo usarlo en el móvil (Android e iPhone)?',
    faqA3: '¡Sí! Funciona directo en Chrome y Safari móvil sin necesidad de descargar ninguna app. Abre la página y conecta de inmediato.',
    faqQ4: '¿Cómo funcionan los gestos con las manos?',
    faqA4: 'Tu cámara detecta gestos locales: desliza dos dedos o haz tijera (✂️) dos veces para cambiar de persona; forma un corazón con ambas manos para lanzar reacciones.',
    faqQ5: '¿Se graban las llamadas o datos personales?',
    faqA5: 'No. Flippy conecta usuarios de forma directa vía WebRTC. El audio y video nunca pasan por nuestros servidores ni se almacenan.',

    // Footer
    footerTitle: 'Flippy · Random Gesture Chats',
    footerDesc: 'La web de videochat aleatorio gratis, segura y sin bots.',
    footerBeKind: 'Sé amable. Disfruta el momento. © 2026 Flippy'
  },

  pt: {
    // Navigation
    navConversation: 'Conversa',
    navGestures: 'Gestos',
    navAbout: 'Sobre',
    navSafety: 'Segurança',
    navFaq: 'Perguntas',
    navSettings: 'Configurações',
    privacyNote: 'Sem gravação no servidor',

    // Header & Leave
    eyebrow: 'UMA PEQUENA CONEXÃO',
    headerTitle: 'Conheça alguém novo.',
    leaveBtn: 'Sair',

    // Empty state
    stageEyebrow: 'SEU ESPAÇO PARA CONECTAR',
    emptyTitle: 'Pronto quando você quiser.',
    emptyTitleSearching: 'Buscando seu próximo olá…',
    emptyTitleConnecting: 'Criando a conexão…',
    emptyTitlePaused: 'Um momento para reconectar.',
    emptyText: 'Ligue sua câmera e microfone.<br>Uma nova conversa começa com você.',
    emptyTextSearching: 'Aguardando outra pessoa com câmera pronta.',
    emptyTextPaused: 'Verifique sua câmera e microfone, depois retome quando quiser.',
    emptyTextDefault: 'Ligue sua câmera e microfone para encontrar sua próxima conversa.',
    chooseToConnect: 'Você escolhe quando conectar',
    readyStatus: 'Pronto quando você quiser',
    handsFreeHint: 'Mãos livres, naturalmente',

    // Status & Labels
    labelIdle: 'Pronto quando você quiser',
    labelPreview: 'Prévia da câmera · não conectado',
    labelSearching: 'Buscando alguém novo…',
    labelConnecting: 'Conectando sua conversa…',
    labelChatting: 'Você está conectado',
    labelPaused: 'Emparelhamento pausado',
    labelReconnecting: 'Reconectando…',

    partnerNext: 'SUA PRÓXIMA CONEXÃO',
    partnerLive: 'SUA NOVA CONEXÃO',
    previewTag: 'SUA PRÉVIA',
    badgeCameraOff: 'CÂMERA DESLIGADA',
    badgeCameraOn: 'CÂMERA LIGADA',
    roomBadge: 'FLIPPY AO VIVO',

    // Controls
    btnEnableMedia: 'Ativar câmera e microfone',
    btnFinding: 'Procurando conexão…',
    btnConnected: 'Conectado',
    btnResume: 'Retomar conversa ↗',
    btnStart: 'Iniciar conversa ↗',
    btnNext: 'Próxima pessoa',
    btnMute: 'Mutar',
    btnUnmute: 'Desmutar',
    btnSendLove: 'Mandar amor',
    micOff: 'Mic desligado',
    micOn: 'Mic ligado',
    micMuted: 'Mic mutado',
    micUnavailable: 'Mic indisponível',
    gesturesWaiting: 'Aguardando câmera para gestos',
    gesturesReady: '✧ Gestos manuais prontos',

    // Notices
    noticeAllowMedia: 'Permita o acesso à câmera e microfone no navegador para começar.',
    noticeCheckingCamera: 'Microfone ligado. Verificando câmera antes de conectar.',
    noticeConnectedChecking: 'Conectado. Verificando câmera…',
    noticeReadyWithMic: 'Câmera e microfone prontos. Inicie a conversa quando quiser.',
    noticeReadyNoMic: 'Câmera pronta, mas microfone indisponível. Reinicie a câmera.',
    noticeConnectionLost: 'Conexão perdida. Reconectando e checando sua câmera…',
    noticeServerUnreachable: 'Não foi possível alcançar o servidor. Tentando de novo…',
    noticeInterrupted: 'Conexão interrompida. Aguardando recuperação…',
    noticeSayHello: 'Diga olá! Dois dedos arrastados para o lado mudam de pessoa.',
    noticeCameraDenied: 'Permissão negada. Abra as opções do navegador e autorize câmera e microfone.',
    noticeCameraUnavailable: 'Câmera ou microfone indisponíveis. Verifique seu sistema.',

    // Gesture Guide
    guideTitle1: 'Um arrasto ou tesoura. Um novo olá.',
    guideDesc1: 'Junte indicador e médio e arraste de lado, ou faça tesoura duas vezes (✂️) para pular.',
    guideTitle2: 'Um coração, com as duas mãos.',
    guideDesc2: 'Junte as pontas dos dedos e polegares para mandar balões de coração.',

    // Settings
    settingsSummary: 'Câmera, som e acessibilidade',
    langSelectLabel: 'Idioma / Language',
    cameraSelectLabel: 'Câmera',
    defaultCamera: 'Câmera padrão',
    dimRoomLabel: 'Estou em um ambiente escuro',
    gesturesEnabledLabel: 'Gestos manuais ativados',
    reduceMotionLabel: 'Reduzir movimento de reações',
    restartCameraBtn: 'Reiniciar câmera e microfone',
    cameraRequirementText: 'Os botões funcionam sem gestos. Câmera preta pausa a busca após dois minutos.',
    advancedHeading: '⚡ Recursos Avançados · Ajuste de Gestos',
    scissorLabel: 'Corte de tesoura (✂️ abrir/fechar dedos duas vezes para pular)',
    swipeLabel: 'Arrastar com 2 dedos (movimento horizontal)',
    sensitivityLabel: 'Sensibilidade dos gestos',
    sensBalanced: 'Equilibrada (Padrão)',
    sensHigh: 'Alta sensibilidade (Mais leve)',
    sensStrict: 'Estrita (Reduz falsos toques)',

    // About Section
    aboutH2: 'Vídeo Chat Aleatório Grátis com Pessoas Reais — Alternativa Limpa ao Omegle',
    aboutP: 'Procurando um site de bate-papo por vídeo aleatório seguro e sem bots? O Flippy é a plataforma de última geração feita para conexões humanas de verdade. Chega de telas pretas e pessoas inadequadas. No Flippy, todos são verificados ao vivo pela câmera, garantindo conversas saudáveis com pessoas legais.',
    card1H4: '100% Rostos Reais e Sem Bots',
    card1P: 'A tecnologia CameraGate exige câmera ativa e iluminada para emparelhar. Vídeos gravados e telas pretas são barrados na hora.',
    card2H4: 'Conversas Seguras e Respeitosas',
    card2P: 'Feito para quem quer trocar uma ideia de verdade: estudantes, meninas, rapazes e pessoas do mundo todo sem baixaria.',
    card3H4: 'Gestos sem Tocar na Tela',
    card3P: 'Controle tudo com as mãos: deslize 2 dedos ou faça tesoura (✂️) para pular. Faça um coração (🫶) para enviar amor.',
    card4H4: 'Totalmente Gratuito e Privado',
    card4P: 'Sem cadastro, sem pedir celular ou cartão. Conexão direta P2P WebRTC sem gravações no servidor.',

    // Safety Section
    safetyH2: 'Segurança Comunitária: Por que o Flippy é Limpo e Sem Nudez',
    safetyBadge1: '✓ Verificação por IA',
    safetyBadge2: '✓ Tolerância Zero a Nudez',
    safetyBadge3: '✓ Só Pessoas Reais',
    safetyBadge4: '✓ Pulo Rápido por Gestos',
    safetyBadge5: '✓ Criptografia P2P',
    safetyP1: 'Muitos sites antigos fecharam porque permitiam comportamentos impróprios. O Flippy foi programado para banir imediatamente nudez e desrespeito.',
    safetyH3_1: 'Como Nossa Verificação Protege Você',
    safetyP2: 'Antes de entrar na fila, o sistema checa luz e movimento da câmera. Quem desligar a câmera ou tapar a lente é pausado na mesma hora.',
    safetyH3_2: 'Espaço Seguro para Mulheres e Pessoas de Bem',
    safetyP3: 'Se você quer conversar com garotas e fazer novas amizades sem medo de ver coisas desagradáveis, o Flippy é o seu lugar.',

    // FAQ Section
    faqH2: 'Perguntas Frequentes sobre o Flippy',
    faqQ1: 'O Flippy é realmente grátis?',
    faqA1: 'Sim! 100% grátis. Não cobramos moedas, planos nem taxas escondidas. Você conversa o quanto quiser.',
    faqQ2: 'Como o Flippy bloqueia pessoas inadequadas?',
    faqA2: 'Nossos algoritmos analisam o feed da câmera em tempo real. Quem não mostra o rosto ou quebra as regras é desconectado instantaneamente.',
    faqQ3: 'Posso usar no celular (Android e iPhone)?',
    faqA3: 'Sim! Funciona liso no Chrome e Safari do celular, sem precisar baixar app na loja.',
    faqQ4: 'Como funcionam os gestos?',
    faqA4: 'A câmera lê suas mãos: 2 dedos arrastando ou tesoura (✂️) pula a chamada; coração com duas mãos solta balões na tela.',
    faqQ5: 'Minhas chamadas são gravadas?',
    faqA5: 'Não! As chamadas são diretas de celular para celular (P2P). Nada fica salvo em servidor.',

    // Footer
    footerTitle: 'Flippy · Random Gesture Chats',
    footerDesc: 'O bate-papo de vídeo aleatório grátis, seguro e sem robôs.',
    footerBeKind: 'Seja gentil. Viva o momento. © 2026 Flippy'
  },

  tr: {
    // Navigation
    navConversation: 'Sohbet',
    navGestures: 'Hareketler',
    navAbout: 'Hakkında',
    navSafety: 'Güvenlik',
    navFaq: 'SSS',
    navSettings: 'Ayarlar',
    privacyNote: 'Sunucuda kayıt yok',

    // Header & Leave
    eyebrow: 'YENİ BİR BAĞLANTI',
    headerTitle: 'Yeni biriyle tanışın.',
    leaveBtn: 'Ayrıl',

    // Empty state
    stageEyebrow: 'TANIŞMA ALANINIZ',
    emptyTitle: 'Hazır olduğunuzda.',
    emptyTitleSearching: 'Yeni bir merhaba aranıyor…',
    emptyTitleConnecting: 'Bağlantı kuruluyor…',
    emptyTitlePaused: 'Yeniden bağlanma anı.',
    emptyText: 'Kamera ve mikrofonunuzu açın.<br>Yeni bir sohbet sizinle başlar.',
    emptyTextSearching: 'Kamerası hazır başka bir kullanıcı bekleniyor.',
    emptyTextPaused: 'Kamera ve mikrofonunuzu kontrol edin, hazır olduğunuzda devam edin.',
    emptyTextDefault: 'Yeni bir sohbete başlamak için kamera ve mikrofonunuzu açın.',
    chooseToConnect: 'Ne zaman bağlanacağınızı siz seçin',
    readyStatus: 'Hazır olduğunuzda',
    handsFreeHint: 'Eller serbest, doğal biçimde',

    // Status & Labels
    labelIdle: 'Hazır olduğunuzda',
    labelPreview: 'Kamera önizlemesi · bağlı değil',
    labelSearching: 'Yeni biri aranıyor…',
    labelConnecting: 'Sohbetiniz bağlanıyor…',
    labelChatting: 'Bağlandınız',
    labelPaused: 'Eşleşme duraklatıldı',
    labelReconnecting: 'Yeniden bağlanıyor…',

    partnerNext: 'SIRADAKİ BAĞLANTINIZ',
    partnerLive: 'YENİ BAĞLANTINIZ',
    previewTag: 'ÖNİZLEMENİZ',
    badgeCameraOff: 'KAMERA KAPALI',
    badgeCameraOn: 'KAMERA AÇIK',
    roomBadge: 'FLIPPY CANLI',

    // Controls
    btnEnableMedia: 'Kamera ve mikrofonu aç',
    btnFinding: 'Bağlantı aranıyor…',
    btnConnected: 'Bağlandı',
    btnResume: 'Sohbete devam et ↗',
    btnStart: 'Sohbete başla ↗',
    btnNext: 'Sıradaki kişi',
    btnMute: 'Sessize al',
    btnUnmute: 'Sesi aç',
    btnSendLove: 'Kalp gönder',
    micOff: 'Mikrofon kapalı',
    micOn: 'Mikrofon açık',
    micMuted: 'Mikrofon sessizde',
    micUnavailable: 'Mikrofon yok',
    gesturesWaiting: 'Kamera bekleniyor',
    gesturesReady: '✧ El hareketleri hazır',

    // Notices
    noticeAllowMedia: 'Başlamak için tarayıcınızdan kamera ve mikrofon izni verin.',
    noticeCheckingCamera: 'Mikrofon açık. Bağlanmadan önce kamera kontrol ediliyor.',
    noticeConnectedChecking: 'Bağlandı. Kamera kontrol ediliyor…',
    noticeReadyWithMic: 'Kamera ve mikrofon hazır. İstediğiniz zaman sohbete başlayın.',
    noticeReadyNoMic: 'Kamera hazır fakat mikrofon bulunamadı.',
    noticeConnectionLost: 'Bağlantı koptu. Yeniden bağlanıyor ve kamera kontrol ediliyor…',
    noticeServerUnreachable: 'Sunucuya ulaşılamadı. Yeniden deneniyor…',
    noticeInterrupted: 'Bağlantı kesildi. Toparlanması bekleniyor…',
    noticeSayHello: 'Merhaba deyin! İki parmağınızı yana kaydırarak yeni birini bulun.',
    noticeCameraDenied: 'Kamera veya mikrofon izni reddedildi. Tarayıcı ayarlarından izin verin.',
    noticeCameraUnavailable: 'Kamera veya mikrofon kullanılamıyor.',

    // Gesture Guide
    guideTitle1: 'Kaydır veya makas yap. Yeni bir merhaba.',
    guideDesc1: 'İşaret ve orta parmağınızı birleştirip yana kaydırın veya iki kez makas (✂️) yapın.',
    guideTitle2: 'İki elle kalp yapın.',
    guideDesc2: 'Parmak uçlarınızı birleştirerek kalp yapın ve sevgi balonları gönderin.',

    // Settings
    settingsSummary: 'Kamera, ses ve erişilebilirlik',
    langSelectLabel: 'Dil / Language',
    cameraSelectLabel: 'Kamera',
    defaultCamera: 'Varsayılan kamera',
    dimRoomLabel: 'Karanlık bir odadayım',
    gesturesEnabledLabel: 'El hareketleri etkin',
    reduceMotionLabel: 'Reaksiyon hareketlerini azalt',
    restartCameraBtn: 'Kamera ve mikrofonu yeniden başlat',
    cameraRequirementText: 'Butonlar hareket olmadan da çalışır. Siyah kamera 2 dakika sonra eşleşmeyi duraklatır.',
    advancedHeading: '⚡ Gelişmiş Özellikler · Hareket Özelleştirme',
    scissorLabel: 'Makas hareketi (✂️ geçmek için iki kez aç/kapa)',
    swipeLabel: 'İki parmak kaydırma (yatay süpürme)',
    sensitivityLabel: 'Hareket Hassasiyeti',
    sensBalanced: 'Dengeli (Standart)',
    sensHigh: 'Yüksek Hassasiyet (Daha hafif hareket)',
    sensStrict: 'Sıkı (Hatalı algılamayı önler)',

    // About Section
    aboutH2: 'Gerçek Kişilerle Ücretsiz Rastgele Görüntülü Sohbet — Temiz Omegle Alternatifi',
    aboutP: 'Güvenli, modern ve gerçek insanlarla tanışabileceğiniz rastgele görüntülü sohbet mi arıyorsunuz? Flippy, sahte botların ve uygunsuz kişilerin olmadığı yeni nesil bir platformdur. Flippy’de herkes canlı kamera testinden geçer.',
    card1H4: '%100 Gerçek İnsanlar & Sıfır Bot',
    card1P: 'CameraGate teknolojimiz eşleşmeden önce aydınlık ve canlı bir kamera şart koşar. Siyah ekranlar engellenir.',
    card2H4: 'Saygılı ve Güvenli Sohbetler',
    card2P: 'Gerçekten konuşmak isteyen kızlar, erkekler ve öğrenciler için temiz bir topluluk.',
    card3H4: 'Ekrana Dokunmadan El Hareketleri',
    card3P: 'İki parmağınızı kaydırarak veya makas (✂️) yaparak sıradaki kişiye geçin. Kalp (🫶) hareketiyle sevgi gönderin.',
    card4H4: 'Tamamen Ücretsiz ve Gizli',
    card4P: 'Üyelik yok, kayıt yok, telefon numarası yok. WebRTC uçtan uca şifreli görüntülü konuşma.',

    // Safety Section
    safetyH2: 'Topluluk Güvenliği: Flippy Neden Temiz ve Güvenilirdir?',
    safetyBadge1: '✓ Yapay Zeka Doğrulaması',
    safetyBadge2: '✓ Çıplaklığa Sıfır Tolerans',
    safetyBadge3: '✓ Yalnızca Gerçek Kişiler',
    safetyBadge4: '✓ Anında Geçiş Hareketi',
    safetyBadge5: '✓ Uçtan Uca Şifreli',
    safetyP1: 'Eski rastgele sohbet siteleri uygunsuz davranışlar yüzünden çöktü. Flippy çıplaklık ve tacize karşı sıfır tolerans uygular.',
    safetyH3_1: 'Kamera Koruması Sizi Nasıl Korur?',
    safetyP2: 'Sıraya girmeden önce kameranın ışığı ve canlılığı kontrol edilir. Kamerasını kapatan veya karartan anında durdurulur.',
    safetyH3_2: 'Kızlar ve Saygılı Kullanıcılar İçin Güvenli Alan',
    safetyP3: 'Rahatsız edilmeden, samimi ve kaliteli sohbetler etmek isteyen herkes için Flippy en güvenli yerdir.',

    // FAQ Section
    faqH2: 'Flippy Hakkında Sıkça Sorulan Sorular',
    faqQ1: 'Flippy tamamen ücretsiz mi?',
    faqA1: 'Evet! Flippy %100 ücretsizdir. Abonelik, jeton veya gizli ücret yoktur.',
    faqQ2: 'Uygunsuz kişiler nasıl engellenir?',
    faqA2: 'Kamera kontrol sistemimiz siyah ekran ve sahte görüntüleri otomatik olarak reddeder. Kuralları çiğneyenler banlanır.',
    faqQ3: 'Telefonda (Android ve iPhone) çalışır mı?',
    faqA3: 'Evet! İndirmeye gerek olmadan doğrudan mobil Chrome ve Safari üzerinden anında bağlanabilirsiniz.',
    faqQ4: 'El hareketleri nasıl çalışır?',
    faqA4: 'Kameranız ellerinizi algılar: 2 parmak kaydırarak sıradakine geçebilir, kalp yaparak balon gönderebilirsiniz.',
    faqQ5: 'Görüşmeler kaydediliyor mu?',
    faqA5: 'Hayır. Tüm aramalar P2P olarak kullanıcılar arasında gerçekleşir, hiçbir sunucuda kaydedilmez.',

    // Footer
    footerTitle: 'Flippy · Random Gesture Chats',
    footerDesc: 'Güvenli, ücretsiz ve botsuz rastgele görüntülü sohbet.',
    footerBeKind: 'Nazik olun. Anı yaşayın. © 2026 Flippy'
  },

  fr: {
    // Navigation
    navConversation: 'Conversation',
    navGestures: 'Gestes',
    navAbout: 'À propos',
    navSafety: 'Sécurité',
    navFaq: 'FAQ',
    navSettings: 'Paramètres',
    privacyNote: 'Aucun enregistrement serveur',

    // Header & Leave
    eyebrow: 'UNE BELLE CONNEXION',
    headerTitle: 'Rencontrez quelqu’un.',
    leaveBtn: 'Quitter',

    // Empty state
    stageEyebrow: 'VOTRE ESPACE D’ÉCHANGE',
    emptyTitle: 'Prêt quand vous l’êtes.',
    emptyTitleSearching: 'Recherche d’un nouveau bonjour…',
    emptyTitleConnecting: 'Établissement de la connexion…',
    emptyTitlePaused: 'Un instant pour reconnecter.',
    emptyText: 'Activez votre caméra et votre micro.<br>Une nouvelle conversation commence avec vous.',
    emptyTextSearching: 'En attente d’une autre personne avec caméra prête.',
    emptyTextPaused: 'Vérifiez votre caméra et votre micro, puis reprenez quand vous êtes prêt.',
    emptyTextDefault: 'Activez votre caméra et votre micro pour démarrer votre prochaine conversation.',
    chooseToConnect: 'Vous choisissez quand vous connecter',
    readyStatus: 'Prêt quand vous l’êtes',
    handsFreeHint: 'Mains libres, naturellement',

    // Status & Labels
    labelIdle: 'Prêt quand vous l’êtes',
    labelPreview: 'Aperçu caméra · non connecté',
    labelSearching: 'Recherche de quelqu’un…',
    labelConnecting: 'Connexion en cours…',
    labelChatting: 'Vous êtes connecté',
    labelPaused: 'Recherche en pause',
    labelReconnecting: 'Reconnexion…',

    partnerNext: 'VOTRE PROCHAINE CONNEXION',
    partnerLive: 'VOTRE NOUVELLE CONNEXION',
    previewTag: 'VOTRE APERÇU',
    badgeCameraOff: 'CAMÉRA ÉTEINTE',
    badgeCameraOn: 'CAMÉRA ALLUMÉE',
    roomBadge: 'FLIPPY EN DIRECT',

    // Controls
    btnEnableMedia: 'Activer caméra & micro',
    btnFinding: 'Recherche de connexion…',
    btnConnected: 'Connecté',
    btnResume: 'Reprendre le chat ↗',
    btnStart: 'Démarrer le chat ↗',
    btnNext: 'Personne suivante',
    btnMute: 'Couper micro',
    btnUnmute: 'Activer micro',
    btnSendLove: 'Envoyer de l’amour',
    micOff: 'Micro éteint',
    micOn: 'Micro actif',
    micMuted: 'Micro coupé',
    micUnavailable: 'Micro indisponible',
    gesturesWaiting: 'En attente de la caméra pour gestes',
    gesturesReady: '✧ Gestes de la main prêts',

    // Notices
    noticeAllowMedia: 'Autorisez l’accès à la caméra et au micro dans votre navigateur pour démarrer.',
    noticeCheckingCamera: 'Micro actif. Vérification de votre caméra avant connexion.',
    noticeConnectedChecking: 'Connecté. Vérification de la caméra…',
    noticeReadyWithMic: 'Caméra et micro prêts. Démarrez quand vous le souhaitez.',
    noticeReadyNoMic: 'Caméra prête mais micro indisponible.',
    noticeConnectionLost: 'Connexion perdue. Reconnexion et vérification de la caméra…',
    noticeServerUnreachable: 'Impossible de joindre le serveur. Nouvelle tentative…',
    noticeInterrupted: 'Connexion interrompue. En attente de reprise…',
    noticeSayHello: 'Dites bonjour ! Balayez deux doigts sur le côté pour passer à la suite.',
    noticeCameraDenied: 'Autorisation refusée. Activez la caméra et le micro dans vos paramètres.',
    noticeCameraUnavailable: 'Caméra ou micro indisponibles.',

    // Gesture Guide
    guideTitle1: 'Un balayage ou un ciseau. Un nouveau bonjour.',
    guideDesc1: 'Joignez l’index et le majeur et balayez de côté, ou faites le ciseau deux fois (✂️).',
    guideTitle2: 'Un cœur avec les deux mains.',
    guideDesc2: 'Joignez les doigts et les pouces pour envoyer des ballons de cœur.',

    // Settings
    settingsSummary: 'Caméra, son et accessibilité',
    langSelectLabel: 'Langue / Language',
    cameraSelectLabel: 'Caméra',
    defaultCamera: 'Caméra par défaut',
    dimRoomLabel: 'Je suis dans une pièce sombre',
    gesturesEnabledLabel: 'Gestes de la main activés',
    reduceMotionLabel: 'Réduire les animations',
    restartCameraBtn: 'Redémarrer caméra & micro',
    cameraRequirementText: 'Les boutons fonctionnent sans gestes. Un écran noir met le chat en pause après deux minutes.',
    advancedHeading: '⚡ Options avancées · Personnalisation des gestes',
    scissorLabel: 'Geste ciseau (✂️ ouvrir/fermer 2 fois pour passer)',
    swipeLabel: 'Balayage à deux doigts (mouvement horizontal)',
    sensitivityLabel: 'Sensibilité des gestes',
    sensBalanced: 'Équilibrée (Standard)',
    sensHigh: 'Haute sensibilité (Mouvement léger)',
    sensStrict: 'Stricte (Évite les faux déclenchements)',

    // About Section
    aboutH2: 'Chat Vidéo Aléatoire Gratuit avec de Vraies Personnes — Alternative Propre à Omegle',
    aboutP: 'Vous cherchez un site de chat vidéo aléatoire sûr et convivial ? Flippy est la plateforme nouvelle génération conçue pour des rencontres authentiques. Fini les bots bizarres et les écrans noirs.',
    card1H4: '100% Vrais Visages & Zéro Bot',
    card1P: 'Notre technologie CameraGate exige une caméra éclairée et en mouvement avant de connecter.',
    card2H4: 'Conversations Sûres & Respectueuses',
    card2P: 'Conçu pour ceux qui veulent vraiment échanger : étudiants, voyageurs et personnes bienveillantes.',
    card3H4: 'Gestes Mains Libres',
    card3P: 'Balayez 2 doigts ou faites le ciseau (✂️) pour passer. Faites un cœur (🫶) pour envoyer de l’amour.',
    card4H4: 'Entièrement Gratuit & Privé',
    card4P: 'Sans compte, sans numéro ni carte bancaire. Connexion P2P WebRTC sans enregistrement.',

    // Safety Section
    safetyH2: 'Sécurité de la Communauté : Pourquoi Flippy est Sain et sans Nudité',
    safetyBadge1: '✓ Vérification par IA',
    safetyBadge2: '✓ Tolérance Zéro Nudité',
    safetyBadge3: '✓ Personnes Réelles Uniquement',
    safetyBadge4: '✓ Saut Rapide par Gestes',
    safetyBadge5: '✓ Chiffrement P2P',
    safetyP1: 'Les anciens sites ont échoué à cause de comportements déplacés. Flippy applique une tolérance zéro stricte contre la nudité et le harcèlement.',
    safetyH3_1: 'Comment Notre Filtre Caméra vous Protège',
    safetyP2: 'Avant la mise en relation, Flippy vérifie la lumière et le mouvement. Toute personne masquant sa caméra est immédiatement mise en pause.',
    safetyH3_2: 'Un Espace Sûr pour les Femmes et Utilisateurs Respectueux',
    safetyP3: 'Flippy offre un cadre chaleureux où chacun peut échanger en toute tranquillité sans être confronté à des contenus indésirables.',

    // FAQ Section
    faqH2: 'Foire Aux Questions sur Flippy',
    faqQ1: 'Flippy est-il totalement gratuit ?',
    faqA1: 'Oui ! Flippy est 100% gratuit. Aucun abonnement, pièce ou frais caché.',
    faqQ2: 'Comment Flippy bloque-t-il les utilisateurs indésirables ?',
    faqA2: 'Notre vérification caméra rejette les écrans noirs et vidéos factices. Les contrevenants sont bannis.',
    faqQ3: 'Fonctionne-t-il sur mobile (Android & iPhone) ?',
    faqA3: 'Oui ! Directement dans Chrome ou Safari mobile, sans installer d’application.',
    faqQ4: 'Comment fonctionnent les gestes ?',
    faqA4: 'Deux doigts balayés ou un ciseau (✂️) pour passer ; deux mains en cœur pour faire jaillir des réactions.',
    faqQ5: 'Les appels sont-ils enregistrés ?',
    faqA5: 'Non. Les communications se font directement entre utilisateurs via WebRTC sans passer par nos serveurs.',

    // Footer
    footerTitle: 'Flippy · Random Gesture Chats',
    footerDesc: 'Le chat vidéo aléatoire gratuit, sûr et sans robots.',
    footerBeKind: 'Soyez bienveillant. Vivez l’instant. © 2026 Flippy'
  },

  de: {
    // Navigation
    navConversation: 'Unterhaltung',
    navGestures: 'Gesten',
    navAbout: 'Über uns',
    navSafety: 'Sicherheit',
    navFaq: 'FAQ',
    navSettings: 'Einstellungen',
    privacyNote: 'Keine Serveraufzeichnung',

    // Header & Leave
    eyebrow: 'EINE ECHTE VERBINDUNG',
    headerTitle: 'Lerne jemanden kennen.',
    leaveBtn: 'Verlassen',

    // Empty state
    stageEyebrow: 'DEIN RAUM FÜR BEGEGNUNGEN',
    emptyTitle: 'Bereit, wenn du es bist.',
    emptyTitleSearching: 'Suche nach einem neuen Hallo…',
    emptyTitleConnecting: 'Verbindung wird hergestellt…',
    emptyTitlePaused: 'Einen Moment zum Wiederverbinden.',
    emptyText: 'Schalte Kamera und Mikrofon ein.<br>Ein neues Gespräch beginnt mit dir.',
    emptyTextSearching: 'Warte auf eine weitere Person mit aktiver Kamera.',
    emptyTextPaused: 'Überprüfe Kamera und Mikrofon und fahre fort, wenn du bereit bist.',
    emptyTextDefault: 'Schalte Kamera und Mikrofon ein, um dein nächstes Gespräch zu starten.',
    chooseToConnect: 'Du entscheidest, wann du sprichst',
    readyStatus: 'Bereit, wenn du es bist',
    handsFreeHint: 'Freihändig, ganz natürlich',

    // Status & Labels
    labelIdle: 'Bereit, wenn du es bist',
    labelPreview: 'Kameravorschau · nicht verbunden',
    labelSearching: 'Suche nach jemandem…',
    labelConnecting: 'Verbindung wird aufgebaut…',
    labelChatting: 'Du bist verbunden',
    labelPaused: 'Suche pausiert',
    labelReconnecting: 'Verbindung wird wiederhergestellt…',

    partnerNext: 'DEINE NÄCHSTE VERBINDUNG',
    partnerLive: 'DEIN NEUER KONTAKT',
    previewTag: 'DEINE VORSCHAU',
    badgeCameraOff: 'KAMERA AUS',
    badgeCameraOn: 'KAMERA AN',
    roomBadge: 'FLIPPY LIVE',

    // Controls
    btnEnableMedia: 'Kamera & Mikrofon aktivieren',
    btnFinding: 'Suche Verbindung…',
    btnConnected: 'Verbunden',
    btnResume: 'Chat fortsetzen ↗',
    btnStart: 'Chat starten ↗',
    btnNext: 'Nächste Person',
    btnMute: 'Stummschalten',
    btnUnmute: 'Ton an',
    btnSendLove: 'Liebe senden',
    micOff: 'Mikro aus',
    micOn: 'Mikro an',
    micMuted: 'Mikro stumm',
    micUnavailable: 'Kein Mikrofon',
    gesturesWaiting: 'Warte auf Kamera für Gesten',
    gesturesReady: '✧ Handgesten bereit',

    // Notices
    noticeAllowMedia: 'Erlaube Kamera- und Mikrofonzugriff im Browser, um zu starten.',
    noticeCheckingCamera: 'Mikrofon aktiv. Kamera wird vor Verbindung geprüft.',
    noticeConnectedChecking: 'Verbunden. Kamera wird geprüft…',
    noticeReadyWithMic: 'Kamera und Mikrofon bereit. Starte, wann du möchtest.',
    noticeReadyNoMic: 'Kamera bereit, aber kein Mikrofon verfügbar.',
    noticeConnectionLost: 'Verbindung verloren. Erneuter Verbindungsaufbau…',
    noticeServerUnreachable: 'Server nicht erreichbar. Neuer Versuch…',
    noticeInterrupted: 'Verbindung unterbrochen. Warte auf Erholung…',
    noticeSayHello: 'Sag Hallo! Wische mit zwei Fingern zur Seite für die nächste Person.',
    noticeCameraDenied: 'Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.',
    noticeCameraUnavailable: 'Kamera oder Mikrofon nicht verfügbar.',

    // Gesture Guide
    guideTitle1: 'Wischen oder Schnippen. Ein neues Hallo.',
    guideDesc1: 'Zeige- und Mittelfinger zusammenhalten und zur Seite wischen oder Schere (✂️) machen.',
    guideTitle2: 'Ein Herz mit beiden Händen.',
    guideDesc2: 'Fingerspitzen und Daumen zusammenführen, um Herzballons zu senden.',

    // Settings
    settingsSummary: 'Kamera, Ton & Barrierefreiheit',
    langSelectLabel: 'Sprache / Language',
    cameraSelectLabel: 'Kamera',
    defaultCamera: 'Standardkamera',
    dimRoomLabel: 'Ich bin in einem dunklen Raum',
    gesturesEnabledLabel: 'Handgesten aktiviert',
    reduceMotionLabel: 'Reaktionsbewegungen reduzieren',
    restartCameraBtn: 'Kamera & Mikrofon neustarten',
    cameraRequirementText: 'Tasten funktionieren auch ohne Gesten. Ein schwarzes Bild pausiert die Suche nach zwei Minuten.',
    advancedHeading: '⚡ Erweiterte Einstellungen · Gestenanpassung',
    scissorLabel: 'Scherenschnitt (✂️ Finger zweimal öffnen/schließen zum Überspringen)',
    swipeLabel: 'Zwei-Finger-Wischen (horizontale Bewegung)',
    sensitivityLabel: 'Gestenempfindlichkeit',
    sensBalanced: 'Ausgewogen (Standard)',
    sensHigh: 'Hohe Empfindlichkeit (Leichtere Bewegung)',
    sensStrict: 'Streng (Verhindert Fehlauslösungen)',

    // About Section
    aboutH2: 'Kostenloser Zufälliger Videochat mit Echten Menschen — Saubere Omegle-Alternative',
    aboutP: 'Auf der Suche nach einem sicheren, modernen Videochat ohne Bots? Flippy ist die Plattform der nächsten Generation für echte persönliche Gespräche. Keine gefälschten Schleifen und keine schwarzen Bildschirme mehr.',
    card1H4: '100% Echte Gesichter & Keine Bots',
    card1P: 'Unsere CameraGate-Technologie setzt eine aktive, beleuchtete Kamera voraus, bevor gematcht wird.',
    card2H4: 'Sichere & Respektvolle Gespräche',
    card2P: 'Gemacht für Menschen, die sich wirklich unterhalten wollen: Studenten, Reisende und freundliche Leute.',
    card3H4: 'Berührungslose Handgesten',
    card3P: 'Steuere alles freihändig: Wische mit 2 Fingern oder schneide wie eine Schere (✂️). Ein Herz (🫶) bringt Freude.',
    card4H4: 'Vollständig Kostenlos & Privat',
    card4P: 'Keine Registrierung, keine Handynummer oder Bankdaten. Ende-zu-Ende verschlüsseltes P2P WebRTC.',

    // Safety Section
    safetyH2: 'Gemeinschaftssicherheit: Warum Flippy Sauber und Nacktheitsfrei ist',
    safetyBadge1: '✓ KI-Kameraüberprüfung',
    safetyBadge2: '✓ Null Toleranz bei Nacktheit',
    safetyBadge3: '✓ Nur Echte Menschen',
    safetyBadge4: '✓ Schnelles Überspringen per Geste',
    safetyBadge5: '✓ P2P Verschlüsselt',
    safetyP1: 'Ältere Seiten scheiterten an unangemessenem Verhalten. Flippy verfolgt eine strikte Null-Toleranz-Politik gegen Nacktheit und Belästigung.',
    safetyH3_1: 'Wie Unser Kameraschutz Dich Schützt',
    safetyP2: 'Vor dem Matching prüft Flippy Licht und Bewegung. Wer die Kamera verdeckt oder ausschaltet, wird sofort pausiert.',
    safetyH3_2: 'Sicherer Raum für Frauen und Respektvolle Nutzer',
    safetyP3: 'Flippy bietet eine angenehme Atmosphäre, in der sich jeder wohlfühlen und ohne unaufgeforderte Inhalte austauschen kann.',

    // FAQ Section
    faqH2: 'Häufig Gestellte Fragen zu Flippy',
    faqQ1: 'Ist Flippy wirklich kostenlos?',
    faqA1: 'Ja! Flippy ist zu 100% kostenlos. Keine Abos, Münzen oder versteckten Gebühren.',
    faqQ2: 'Wie blockiert Flippy unpassende Nutzer?',
    faqA2: 'Unsere Kamerasysteme prüfen Live-Bewegungen und weisen Standbilder sofort ab. Regelbrecher werden gebannt.',
    faqQ3: 'Funktioniert es auf Smartphones (Android & iPhone)?',
    faqA3: 'Ja! Direkt im mobilen Chrome oder Safari ohne App-Download nutzbar.',
    faqQ4: 'Wie funktionieren die Handgesten?',
    faqA4: 'Deine Kamera erkennt Gesten lokal: 2 Finger wischen zum Überspringen; zwei Hände als Herz senden Reaktionen.',
    faqQ5: 'Werden Gespräche aufgezeichnet?',
    faqA5: 'Nein. Gespräche laufen direkt von Gerät zu Gerät (P2P). Es wird nichts auf Servern gespeichert.',

    // Footer
    footerTitle: 'Flippy · Random Gesture Chats',
    footerDesc: 'Der sichere, kostenlose und bot-freie Zufalls-Videochat.',
    footerBeKind: 'Sei freundlich. Lebe den Moment. © 2026 Flippy'
  }
};

let currentLang = 'en';

export function detectLanguage() {
  try {
    if (typeof window !== 'undefined' && window.location) {
      const urlParams = new URLSearchParams(window.location.search);
      const queryLang = urlParams.get('lang');
      if (queryLang && SUPPORTED_LANGUAGES[queryLang]) return queryLang;
    }
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('flippy_lang');
      if (saved && SUPPORTED_LANGUAGES[saved]) return saved;
    }
    if (typeof navigator !== 'undefined') {
      const navLangs = navigator.languages || [navigator.language || 'en'];
      for (const l of navLangs) {
        const code = l.slice(0, 2).toLowerCase();
        if (SUPPORTED_LANGUAGES[code]) return code;
      }
    }
  } catch {}
  return 'en';
}

export function t(key, fallback = '') {
  return TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en?.[key] || fallback;
}

export function getLanguage() {
  return currentLang;
}

export function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) lang = 'en';
  currentLang = lang;
  try { localStorage.setItem('flippy_lang', lang); } catch {}
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang;
    applyTranslations();
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('flippy:languagechange', { detail: { lang } }));
  }
}

export function applyTranslations() {
  if (typeof document === 'undefined') return;
  const elements = document.querySelectorAll('[data-i18n]');
  for (const el of elements) {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (!text) continue;
    if (el.getAttribute('data-i18n-html') === 'true') {
      el.innerHTML = text;
    } else {
      const svg = el.querySelector('svg');
      if (svg) {
        let updated = false;
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            node.textContent = ' ' + text;
            updated = true;
            break;
          }
        }
        if (!updated) {
          el.appendChild(document.createTextNode(' ' + text));
        }
      } else {
        el.textContent = text;
      }
    }
  }

  // Translate placeholders / aria-labels
  const labeled = document.querySelectorAll('[data-i18n-label]');
  for (const el of labeled) {
    const key = el.getAttribute('data-i18n-label');
    const text = t(key);
    if (text) el.setAttribute('aria-label', text);
  }

  // Translate SEO card titles while keeping SVG and clean h4 tags
  const seoCards = document.querySelectorAll('.seo-card');
  const cardKeys = ['card1H4', 'card2H4', 'card3H4', 'card4H4'];
  seoCards.forEach((card, index) => {
    const h4 = card.querySelector('h4');
    const text = t(cardKeys[index]);
    if (h4 && text) {
      for (const node of h4.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          node.textContent = ' ' + text;
          break;
        }
      }
    }
  });

  // Update document title and meta description if defined
  const pageTitle = t('pageTitle');
  if (pageTitle) document.title = pageTitle;
  const metaDesc = document.querySelector('meta[name="description"]');
  const descText = t('metaDescription');
  if (metaDesc && descText) metaDesc.setAttribute('content', descText);

  // Update language selector dropdown if present
  const select = document.getElementById('langSelect');
  if (select && select.value !== currentLang) {
    select.value = currentLang;
  }
}

export function initI18n() {
  currentLang = detectLanguage();
  if (typeof document !== 'undefined') {
    document.documentElement.lang = currentLang;
    applyTranslations();
  }
  return currentLang;
}
