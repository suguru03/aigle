'use strict';

class Promise {

  constructor(executor) {
    this._value = undefined;
    this._parent = undefined;
    this._queue = [];
    this._execute(executor);
  }

  toString() {
    return '[object Promise]';
  }

  then(onFullfilled, onRejected) {
    if (onFullfilled !== undefined) {
      this._makeResover(onFullfilled, this);
    }
    if (onRejected !== undefined) {
      this._makeCatcher(onRejected, this);
    }
    return this;
  }

  catch(onRejected) {
    let l = arguments.length;
    if (l === 1) {
      return this._makeCatcher(onRejected, this);
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
    return this._makeCatcher(onRejected, this, errorTypes);
  }

  finally(handler) {
    this._queue.push([0, handler, this]);
    return this;
  }

  _makeResover(onFullfilled, promise) {
    this._queue.push([1, onFullfilled, promise]);
    return this;
  }

  _makeCatcher(onRejected, promise, errorTypes) {
    this._queue.push([2, onRejected, promise, errorTypes]);
    return this;
  }

  _execute(executor) {
    let sync = true;
    try {
      executor((value) => {
        if (!sync) {
          return this._resolve(value);
        }
        process.nextTick(() => {
          this._resolve(value);
        });
      }, (reason) => {
        if (!sync) {
          return this._reject(reason);
        }
        process.nextTick(() => {
          this._reject(reason);
        });
      });
    } catch(e) {
      this._reject(e);
    }
    sync = false;
  }

  _getNextTask(index) {
    let num;
    let task = this._queue.shift();
    while (task && (num = task[0]) && num !== index) {
      task = this._queue.shift();
    }
    return task;
  }

  _resolve(value) {
    const task = this._getNextTask(1);
    if (!task) {
      return;
    }
    if (task[0] === 0) {
      return this._finally(task, '_resolve', value);
    }
    const p = task[1](value);
    const promise = task[2];
    if (p && p.then) {
      p.then((value) => {
        promise._resolve(value);
      });
    } else {
      promise._resolve(p);
    }
  }

  _reject(reason) {
    const task = this._getNextTask(2);
    if (!task) {
      return;
    }
    if (task[0] === 0) {
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
    const p = task[1](reason);
    const promise = task[2];
    if (p && p.then) {
      p.then((value) => {
        promise._resolve(value);
      }, (reason) => {
        promise._reject(reason);
      });
    } else {
      promise._resolve(p);
    }
  }

  _finally(task, key, value) {
    const p = task[1]();
    const promise = task[2];
    if (p && p.then) {
      p.then(() => {
        promise[key](value);
      }, (reason) => {
        promise._reject(reason);
      });
    } else {
      promise[key](value);
    }
  }
}

function resolve(value) {
  return new Promise(resolve => {
    resolve(value);
  });
}

function reject(reason) {
  return new Promise((resolve, reject) => {
    reject(reason);
  });
}

Promise.resolve = resolve;
Promise.reject = reject;

Promise.all = require('./all')(Promise);

Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

module.exports = Promise;
