'use strict';

class Queue {
  constructor(size = 8) {
    this.array = Array(size);
    this.length = 0;
  }

  push(task) {
    this.array[this.length++] = task;
  }
}

module.exports = Queue;
