export class AsyncScope {
  constructor() { this.epoch = 0; this.reset(); }
  reset() { this.epoch++; this.tail = Promise.resolve(); }
  enqueue(operation, onError = () => {}) {
    const epoch = this.epoch;
    const current = () => epoch === this.epoch;
    this.tail = this.tail.then(() => current() ? operation(current) : undefined)
      .catch(error => { if (current()) onError(error); });
    return this.tail;
  }
}
