'use strict';

const Queue = require('./queue');

class Promise {

  constructor(executor) {
    this._value = undefined;
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
    this._queue.resolve(onFullfilled);
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
      return this._resumeResolve();
    case 2:
      return this._resumeReject();
    }
  }

  _resolve() {
    let task;
    while ((task = this._queue.getResolve())) {
      if (task[3]) {
        return this._finally(task, '_resolve', this._value);
      }
      let p = task[2](this._value);
      if (p instanceof Promise) {
        p._queue.resolve(this._callResolve).catch(this._callReject);
        p._resume();
        return;
      }
      if (p && p.then) {
        p.then(this._callResolve, this._callReject);
        return;
      }
      this._value = p;
    }
    if (this._resolved === 0) {
      this._resolved = 1;
      this._result = this._value;
    }
  }

  _reject() {
    const task = this._queue.getCatch();
    if (!task) {
      if (this._resolved === 0) {
        this._resolved = 2;
        this._result = this._value;
      }
      return;
    }
    if (task[4]) {
      return this._finally(task, '_reject', this._value);
    }
    const errorTypes = task[3];
    if (errorTypes) {
      let l = errorTypes.length;
      let found = false;
      while (!found && l--) {
        found = this._value instanceof errorTypes[l];
      }
      if (!found) {
        return this._reject();
      }
    }
    const p = task[2](this._value);
    if (p instanceof Promise) {
      p._queue.resolve(this._callResolve).catch(this._callReject);
      p._resume();
      return;
    }
    if (p && p.then) {
      p.then(this._callResolve, this._callReject);
    } else {
      this._value = p;
      this._resolve();
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
  this._value = value;
  this._resolve();
  return value;
}

function callReject(reason) {
  this._value = reason;
  this._reject();
  return reason;
}

function resumeResolve() {
  this._resolved = 0;
  this._resolve();
  return this;
}

function resumeReject() {
  this._resolved = 0;
  this._reject();
  return this;
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
