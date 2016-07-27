'use strict';

const util = require('./util');
const noop = util.noop;

class Promise {

  constructor(executor) {
    this._value = undefined;
    this._parent = undefined;
    this._queue = [];
    this._finally = noop;
    this._execute(executor);
  }

  toString() {
    return '[object Promise]';
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

  finally(func) {
    this._finally = func;
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

  then(resolve, reject) {
    if (resolve !== undefined) {
      this._makeResover(resolve, this);
    }
    if (reject !== undefined) {
      this._makeCatcher(reject, this);
    }
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
    let next = this._queue.shift();
    while (next && next[0] !== key) {
      next = this._queue.shift();
    }
    return next;
  }

  _resolve(value) {
    const next = this._getNextTask('resolve');
    if (!next) {
      return;
    }
    process.nextTick(() => {
      const p = next[1](value);
      const promise = next[2];
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
    const next = this._getNextTask('catch');
    if (!next) {
      return;
    }
    const errorTypes = next[3];
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
      const p = next[1](reason);
      const promise = next[2];
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
