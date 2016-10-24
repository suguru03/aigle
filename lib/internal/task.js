'use strict';

class Task {

  constructor(func, promise, value) {
    this.func = func;
    this.promise = promise;
    this.value = value;
    this.head = undefined;
    this.tail = undefined;
  }
}

module.exports = Task;
