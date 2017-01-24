'use strict';

const { INTERNAL } = require('./util');

module.exports = function(Promise) {

  class PromiseArray {

    constructor(array) {
      this.promise = new Promise(INTERNAL);
      const length = array.length;
      if (length === 0) {
        this.promise._resolve([]);
        return;
      }
      this._rest = length;
      this._result = Array(length);
      this._iterate(array);
    }

    _resolve(value, index) {
      this._result[index] = value;
      if (--this._rest === 0) {
        this.promise._resolve(this._result);
      }
    }

    _reject(reason) {
      this.promise._reject(reason);
    }

    _iterate(array) {
      let l = array.length;
      while (l--) {
        const p = array[l];
        if (p instanceof Promise) {
          switch (p._resolved) {
          case 0:
            p._addReceiver(this, l);
            continue;
          case 1:
            this._resolve(p._value, l);
            continue;
          case 2:
            this._reject(p._value);
            return;
          }
        }
        if (p && p.then) {
          p.then(this._makeCallback(l), this.promise._callReject);
        } else {
          this._resolve(p, l);
        }
      }
    }
    _makeCallback(l) {
      return value => this._resolve(value, l);
    }
  }

  return PromiseArray;
};
