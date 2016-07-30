'use strict';

const Queue = require('./queue');

class Promise {

  constructor(executor) {
    this._result = undefined;
    this._resolved = 0;
    this._callResolve = callResolve.bind(this);
    this._callReject = callReject.bind(this);
    this._resumeResolve = resumeResolve.bind(this);
    this._resumeReject = resumeReject.bind(this);
    this._queue = new Queue();
    executor(this._callResolve, this._callReject);
  }

  toString() {
    return '[object Promise]';
  }

  then(onFullfilled, onRejected) {
    if (onFullfilled !== undefined) {
      this._queue.resolve(onFullfilled);
    }
    if (onRejected !== undefined) {
      this._queue.catch(onRejected);
    }
    return this._resume();
  }

  catch(onRejected) {
    let l = arguments.length;
    if (l === 1) {
      this._queue.catch(onRejected);
      return this;
    }
    onRejected = arguments[--l];
    // TODO error handling
    if (typeof onRejected !== 'function') {
      return this;
    }
    const errorTypes = Array(l);
    while (l--) {
      errorTypes[l] = arguments[l];
    }
    this._queue.catch(onRejected, errorTypes);
    return this;
  }

  finally(handler) {
    this._queue.finally(handler);
    return this;
  }

  all() {
    this._queue.resolve(all);
    return this._resume();
  }

  _resume() {
    switch (this._resolved) {
    case 0:
      return this;
    case 1:
      this._resumeResolve();
      return this;
    case 2:
      this._resumeReject();
      return this;
    }
  }

  _resolve(value) {
    let task;
    while ((task = this._queue.getResolve())) {
      if (task[3]) {
        return this._finally(task, '_resolve', value);
      }
      let p = task[2](value);
      if (p instanceof Promise) {
        p._queue.resolve(this._callResolve);
        p._queue.catch(this._callReject);
        p._resume();
        return;
      }
      if (p && p.then) {
        p.then(this._callResolve, this._callReject);
        return;
      }
      value = p;
    }
    if (this._resolved === 0) {
      this._resolved = 1;
      this._value = value;
    }
  }

  _reject(reason) {
    const task = this._queue.getCatch();
    if (!task) {
      if (this._resolved === 0) {
        this._resolved = 2;
        this._value = reason;
      }
      return;
    }
    if (task[4]) {
      return this._finally(task, '_reject', reason);
    }
    const errorTypes = task[3];
    if (errorTypes) {
      let l = errorTypes.length;
      let found = false;
      while (!found && l--) {
        found = reason instanceof errorTypes[l];
      }
      if (!found) {
        return this._reject(reason);
      }
    }
    const p = task[2](reason);
    if (p instanceof Promise) {
      p._queue.resolve(this._callResolve);
      p._queue.catch(this._callReject);
      p._resume();
      return;
    }
    if (p && p.then) {
      p.then(this._callResolve, this._callReject);
    } else {
      this._resolve(p);
    }
  }

  _finally(task, key, value) {
    const p = task[2]();
    if (p && p.then) {
      const self = this;
      p.then(function() {
        self[key](value);
      }, this._callReject);
    } else {
      this[key](value);
    }
  }
}

function callResolve(value) {
  this._resolve(value);
  return value;
}
function callReject(reason) {
  this._reject(reason);
  return reason;
}
function resumeResolve() {
  this._resolved = 0;
  this._resolve(this._value);
}
function resumeReject() {
  this._resolved = 0;
  this._reject(this._value);
}

function resolve(value) {
  return new Promise(function(resolve) {
    resolve(value);
  });
}

function reject(reason) {
  return new Promise(function(resolve, reject) {
    reject(reason);
  });
}

const all = require('./all')(Promise);

Promise.resolve = resolve;
Promise.reject = reject;

Promise.all = all;

Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

module.exports = Promise;
