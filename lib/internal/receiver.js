'use strict';

class Receiver {

  constructor(promise, onFullfilled, onRejected, errorTypes, finallyHandler) {
    this.promise = promise;
    this.onFullfilled = onFullfilled;
    this.onRejected = onRejected;
    this.errorTypes = errorTypes;
    this.finallyHandler = finallyHandler;
    this.head = undefined;
    this.tail = undefined;
  }
}

class InnerReceiver {

  constructor(key, onFullfilled, onRejected) {
    this.key = key;
    this.onFullfilled = onFullfilled;
    this.onRejected = onRejected;
    this.head = undefined;
    this.tail = undefined;
  }
}

module.exports = {
  Receiver,
  InnerReceiver
};
