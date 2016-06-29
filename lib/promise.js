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

  finally(func) {
    this._finally = func;
    return this;
  }

  then(resolve) {
    let handler = process.domain.bind(resolve);
    let promise = new Promise(noop);
    promise._parent = this;
    this._queue.push([handler, promise]);
    return promise;
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

  _resolve(value) {
    let next = this._queue.shift();
    if (next) {
      process.nextTick(() => {
        let p = next[0](value);
        let promise = next[1];
        if (p && p.then) {
          p.then((value) => {
            promise._resolve(value);
          });
        } else {
          promise._resolve(p);
        }
      });
    }
  }

  _reject(reason) {
    this._rejectFunc(reason);
  }

}

Promise.TypeError = TypeError;
Promise.RangeError = RangeError;
Promise.Promise = Promise;

module.exports = Promise;
