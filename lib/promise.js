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

  then(resolve, reject) {
    if (resolve !== undefined) {
      this._makeResover(resolve, this);
    }
    if (reject !== undefined) {
      this._makeCatcher(reject, this);
    }
    return this;
  }

  catch(reject) {
    let l = arguments.length;
    if (l === 1) {
      return this._makeCatcher(reject, this);
    }
    reject = arguments[--l];
    // TODO error handling
    if (typeof reject !== 'function') {
      return this;
    }
    const errorTypes = Array(l);
    while (l--) {
      errorTypes[l] = arguments[l];
    }
    return this._makeCatcher(reject, this, errorTypes);
  }

  finally(handler) {
    this._queue.push(['finally', handler, this]);
    return this;
  }

  _makeResover(resolve, promise) {
    this._queue.push(['resolve', resolve, promise]);
    return this;
  }

  _makeCatcher(reject, promise, errorTypes) {
    this._queue.push(['catch', reject, promise, errorTypes]);
    return this;
  }

  _execute(executor) {
    try {
      executor((value) => {
        process.nextTick(() => {
          this._resolve(value);
        });
      }, (reason) => {
        process.nextTick(() => {
          this._reject(reason);
        });
      });
    } catch(e) {
      this._reject(e);
    }
  }

  _getNextTask(key) {
    const exp = new RegExp(`${key}|finally`);
    let task = this._queue.shift();
    while (task && !exp.test(task[0])) {
      task = this._queue.shift();
    }
    return task;
  }

  _resolve(value) {
    const task = this._getNextTask('resolve');
    if (!task) {
      return;
    }
    if (task[0] === 'finally') {
      return this._finally(task, '_resolve', value);
    }
    process.nextTick(() => {
      const p = task[1](value);
      const promise = task[2];
      if (p && p.then) {
        p.then((value) => {
          promise._resolve(value);
        });
      } else {
        promise._resolve(p);
      }
    });
  }

  _reject(reason) {
    const task = this._getNextTask('catch');
    if (!task) {
      return;
    }
    if (task[0] === 'finally') {
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
    process.nextTick(() => {
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
    });
  }

  _finally(task, key, value) {
    process.nextTick(() => {
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
    });
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
Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

module.exports = Promise;
