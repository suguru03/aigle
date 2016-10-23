'use strict';

class Receiver {

  constructor(promise, onFullfilled, onRejected, finallyHandler) {
    this.promise = promise;
    this.onFullfilled = onFullfilled;
    this.onRejected = onRejected;
    this.finallyHandler = finallyHandler;
  }
}

module.exports = Receiver;
