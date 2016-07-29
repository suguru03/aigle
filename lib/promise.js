'use strict';

const Queue = require('./queue');

class Promise {

  constructor(executor) {
    this._value = undefined;
    this._parent = undefined;
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
    return this;
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

  _execute(executor) {
    executor((value) => {
      setImmediate(() => {
        this._resolve(value);
      });
    }, (reason) => {
      setImmediate(() => {
        this._reject(reason);
      });
    });
  }

  _resolve(value) {
    let task;
    while ((task = this._queue.getResolve())) {
      if (task.finally) {
        return this._finally(task, '_resolve', value);
      }
      let p = task.handler(value);
      if (p && p.then) {
        p.then(value => {
          this._resolve(value);
        });
        return;
      }
      value = p;
    }
  }

  _reject(reason) {
    const task = this._queue.getCatch();
    if (!task) {
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
    if (p && p.then) {
      p.then((value) => {
        this._resolve(value);
      }, (reason) => {
        this._reject(reason);
      });
    } else {
      this._resolve(p);
    }
  }

  _finally(task, key, value) {
    const p = task.handler();
    if (p && p.then) {
      p.then(() => {
        this[key](value);
      }, (reason) => {
        this._reject(reason);
      });
    } else {
      this[key](value);
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
