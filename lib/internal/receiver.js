'use strict';

class Receiver {

  constructor(promise, onFullfilled, onRejected, errorTypes, finallyHandler) {
    this.promise = promise;
    this.onFullfilled = onFullfilled;
    this.onRejected = onRejected;
    this.errorTypes = errorTypes;
    this.finallyHandler = finallyHandler;
  }
}

module.exports = Receiver;
