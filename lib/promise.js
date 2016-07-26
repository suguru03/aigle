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

  resolve(resolve) {
    console.log(resolve);
    return this;
  }

  reject(reject) {
    console.log(reject);
    return this;
  }

  catch(reject) {
    this._makeCatcher(reject, this);
    return this;
  }

  finally(func) {
    this._finally = func;
    return this;
  }

  _makeResover(resolve, promise) {
    this._queue.push(['resolve', resolve, promise]);
  }

  _makeCatcher(reject, promise) {
    this._queue.push(['catch', reject, promise]);
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
    let next = this._getNextTask('resolve');
    if (!next) {
      return;
    }
    process.nextTick(() => {
      let p = next[1](value);
      let promise = next[2];
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
    let next = this._getNextTask('catch');
    if (!next) {
      return;
    }
    process.nextTick(() => {
      let p = next[1](reason);
      let promise = next[2];
      if (p && p.then) {
        p.then((value) => {
          promise._resolve(value);
        }, (reason) => {
          promise._reject(reason);
        });
      } else if (p instanceof Error) {
        promise._reject(p);
      } else {
        promise._resolve(p);
      }
    });
  }

}

Promise.TypeError = TypeError;
Promise.RangeError = RangeError;
Promise.Promise = Promise;

module.exports = Promise;
