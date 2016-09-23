'use strict';

class Queue {

  constructor() {
    this._tail = null;
    this._head = null;
    this.length = 0;
  }

  push(task) {
    const tail = this._tail;
    this._tail = task;
    if (tail) {
      tail._tail = task;
    } else {
      this._head = task;
    }
    this.length++;
  }

  shift() {
    const head = this._head;
    if (head) {
      this._head = head._tail;
    }
    if (!this._head) {
      this._head = null;
      this._tail = null;
    }
    this.length--;
    return head;
  }
}

module.exports = Queue;
