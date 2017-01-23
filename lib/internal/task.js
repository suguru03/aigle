'use strict';

class Task {

  constructor(promise, receiver, onFullfilled, onRejected) {
    this.promise = promise;
    this.receiver = receiver;
    this.onFullfilled = onFullfilled;
    this.onRejected = onRejected;
    this.head = undefined;
    this.tail = undefined;
  }
}

module.exports = Task;
