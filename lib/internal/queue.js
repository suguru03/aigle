'use strict';

class Task {

  constructor(task) {
    this._task = task;
    this._tail = null;
  }
}

class Queue {

  constructor() {
    this._tail = null;
    this._head = null;
  }

  push(_task) {
    const task = new Task(_task);
    const tail = this._tail;
    this._tail = task;
    if (tail) {
      tail._tail = task;
    } else {
      this._head = task;
    }
  }

  shift() {
    const head = this._head;
    if (head) {
      this._head = head._tail;
    } else {
      return;
    }
    if (!this._head) {
      this._head = null;
      this._tail = null;
    }
    return head._task;
  }
}

module.exports = Queue;
