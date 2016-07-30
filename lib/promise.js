'use strict';

const Queue = require('./queue');

class Promise {

  constructor(executor) {
    this._result = undefined;
    this._resolved = 0;
    this._callResolve = undefined;
    this._callReject = undefined;
    this._makeCaller();
    this._queue = new Queue();
    this._execute(executor);
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
    return this;
  }

  _makeCaller() {
    const self = this;
    this._callResolve = function(value) {
      self._resolve(value);
      return value;
    };
    this._callReject = function(reason) {
      self._reject(reason);
      return reason;
    };
  }

  _execute(executor) {
    const self = this;
    executor(function(value) {
      setImmediate(function() {
        self._resolve(value);
      });
    }, function(reason) {
      setImmediate(function() {
        self._reject(reason);
      });
    });
  }

  _resume() {
    const self = this;
    switch (this._resolved) {
    case 0:
      return this;
    case 1:
      setImmediate(function() {
        self._resolve(self._value);
      });
      return this;
    case 2:
      setImmediate(function() {
        self._reject(self._value);
      });
      return this;
    }
  }

  _resolve(value) {
    let task;
    while ((task = this._queue.getResolve())) {
      if (task.finally) {
        return this._finally(task, '_resolve', value);
      }
      let p = task.handler(value);
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
    if (task.finally) {
      return this._finally(task, '_reject', reason);
    }
    const errorTypes = task.errorTypes;
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
    const p = task.handler(reason);
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
    const p = task.handler();
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
