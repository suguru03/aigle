'use strict';

class Queue {

  constructor() {
    this.tail = undefined;
    this.head = undefined;
  }

  push(task) {
    const { tail } = this;
    this.tail = task;
    if (tail) {
      tail.tail = task;
    } else {
      this.head = task;
    }
  }

  shift() {
    const { head } = this;
    this.head = head.tail;
    if (!this.head) {
      this.tail = undefined;
    }
    return head;
  }
}

module.exports = Queue;
