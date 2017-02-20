'use strict';

class Task {

  constructor(promise, receiver, onFulfilled, onRejected) {
    this.promise = promise;
    this.receiver = receiver;
    this.onFulfilled = onFulfilled;
    this.onRejected = onRejected;
    this.head = undefined;
    this.tail = undefined;
  }
}

module.exports = Task;
