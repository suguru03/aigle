'use strict';

class Task {

  constructor(task) {
    this.task = task;
    this.tail = null;
  }
}

class Queue {

  constructor() {
    this.tail = null;
    this.head = null;
  }

  push(_task) {
    const task = new Task(_task);
    const tail = this.tail;
    this.tail = task;
    if (tail) {
      tail.tail = task;
    } else {
      this.head = task;
    }
  }

  unshift(_task) {
    const task = new Task(_task);
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
    return head.task;
  }
}

module.exports = Queue;
