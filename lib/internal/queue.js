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

  unshift(task) {
    const head = this.head;
    this.head = task;
    if (head) {
      task.tail = head;
    } else {
      this.tail = task;
    }
  }

  shift() {
    const head = this.head;
    if (head) {
      this.head = head.tail;
    } else {
      return;
    }
    if (!this.head) {
      this.tail = null;
    }
    return head;
  }
}

module.exports = Queue;
