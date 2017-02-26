'use strict';

class Queue {

  constructor() {
    this.tail = undefined;
    this.head = undefined;
  }

  push(task) {
    const tail = this.tail;
    this.tail = task;
    if (tail) {
      tail.tail = task;
    } else {
      this.head = task;
    }
  }

  shift() {
    const head = this.head;
    this.head = head.tail;
    if (!this.head) {
      this.tail = null;
    }
    return head;
  }
}

module.exports = Queue;
