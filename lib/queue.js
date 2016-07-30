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
    const task = [undefined, this._lastIndex++, handler];
    const tail = this._resolveTail;
    this._resolveTail = task;
    if (tail) {
      tail[0] = task;
    } else {
      this._resolveHead = task;
    }
    return this;
  }

  catch(handler, errorTypes) {
    const task = [undefined, this._lastIndex++, handler, errorTypes];
    const tail = this._rejectTail;
    this._rejectTail = task;
    if (tail) {
      tail[0] = task;
    } else {
      this._rejectHead = task;
    }
    return this;
  }

  finally(handler) {
    const resolveTask = [undefined, this._lastIndex, handler, true];
    const resolveTail = this._resolveTail;
    this._resolveTail = resolveTask;
    if (resolveTail) {
      resolveTail[0] = resolveTask;
    } else {
      this._resolveHead = resolveTask;
    }

    const catchTask = [undefined, this._lastIndex++, handler, undefined, true];
    const catchTail = this._rejectTail;
    this._rejectTail = catchTask;
    if (catchTail) {
      catchTail[0] = catchTask;
    } else {
      this._rejectHead = catchTask;
    }
    return this;
  }

  getResolve() {
    let head = this._resolveHead;
    if (head) {
      this._current = head[1];
      let next = head[0];
      if (next) {
        this._resolveHead = next;
        return head;
      }
    }
    this._current = -1;
    this._lastIndex = 0;
    this._resolveHead = undefined;
    this._resolveTail = undefined;
    this._rejectHead = undefined;
    this._rejectTail = undefined;
    return head;
  }

  getCatch() {
    let head = this._rejectHead;
    while (head && head[1] <= this._current) {
      head = head[0];
    }
    let resolveHead = this._resolveHead;
    if (head) {
      this._current = head[1];
      this._rejectHead = head[0];
      while (resolveHead && resolveHead[1] <= this._current) {
        resolveHead = resolveHead[0];
      }
      this._resolveHead = resolveHead;
    } else {
      this._current = -1;
      this._lastIndex = 0;
      this._resolveHead = undefined;
      this._resolveTail = undefined;
      this._rejectHead = undefined;
      this._rejectTail = undefined;
    }
    return head;
  }
}

module.exports = Queue;
