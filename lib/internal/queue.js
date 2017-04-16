'use strict';

class Queue {

  constructor(size = 8) {
    this.array = Array(size);
    this.length = 0;
  }

  push(task) {
    this.array[this.length++] = task;
  }

  shift() {
    if (this.length === 0) {
      return undefined;
    }
    const index = --this.length;
    const task = this.array[index];
    this.array[index] = undefined;
    return task;
  }
}

module.exports = Queue;
