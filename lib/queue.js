'use strict';

class Queue {

  constructor() {
    this._current = -1;
    this._lastIndex = 0;
    this._resolveHead = undefined;
    this._resolveTail = undefined;
    this._rejectHead = undefined;
    this._rejectTail = undefined;
  }

  resolve(handler) {
    const task = {
      _index: this._lastIndex++,
      handler: handler
    };
    const tail = this._resolveTail;
    if (!tail) {
      this._resolveHead = task;
      this._resolveTail = task;
    } else {
      tail.next = task;
      this._resolveTail = task;
    }
  }

  catch(handler, errorTypes) {
    const task = {
      _index: this._lastIndex++,
      handler: handler,
      errorTypes: errorTypes
    };
    const tail = this._catchTail;
    if (!tail) {
      this._catchHead = task;
      this._catchTail = task;
    } else {
      tail.next = task;
      this._catchTail = task;
    }
  }

  finally(handler) {
    const resolveTask = {
      _index: this._lastIndex,
      handler: handler,
      finally: true
    };
    const resolveTail = this._resolveTail;
    if (!resolveTail) {
      this._resolveHead = resolveTask;
      this._resolveTail = resolveTask;
    } else {
      resolveTail.next = resolveTask;
      this._resolveTail = resolveTask;
    }

    const catchTask = {
      _index: this._lastIndex++,
      handler: handler,
      finally: true
    };
    const catchTail = this._catchTail;
    if (!catchTail) {
      this._catchHead = catchTask;
      this._catchTail = catchTask;
    } else {
      catchTail.next = catchTask;
      this._catchTail = catchTask;
    }
  }

  getResolve() {
    let head = this._resolveHead;
    if (head) {
      this._current = head._index;
      this._resolveHead = head.next;
    } else {
      this._resolveHead = undefined;
      this._resolveTail = undefined;
    }
    return head;
  }

  getCatch() {
    let head = this._catchHead;
    while (head && head._index <= this._current) {
      head = head.next;
    }
    let resolveHead = this._resolveHead;
    if (head) {
      this._current = head._index;
      this._catchHead = head.next;
      while (resolveHead && resolveHead._index <= this._current) {
        resolveHead = resolveHead.next;
      }
      this._resolveHead = resolveHead;
    } else {
      this._resolveHead = undefined;
      this._resolveTail = undefined;
      this._catchHead = undefined;
      this._catchTail = undefined;
    }
    return head;
  }
}

module.exports = Queue;
