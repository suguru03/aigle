'use strict';

module.exports = function(Promise, Proxy) {

  class PromiseArray extends Proxy {

    constructor(array) {
      super();
      const length = array.length;
      if (length === 0) {
        this._resolve([]);
        return;
      }
      this._rest = length;
      this._result = array;
      iterate(this, array);
    }

    _callResolve(value, index) {
      this._result[index] = value;
      if (--this._rest === 0) {
        this._resolve(this._result);
      }
    }
  }

  return PromiseArray;

  function iterate(promise, array) {
    let l = array.length;
    while (l--) {
      const p = array[l];
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 0:
          p._addReceiver(promise, l);
          continue;
        case 1:
          promise._callResolve(p._value, l);
          continue;
        case 2:
          promise._reject(p._value);
          return;
        }
      }
      if (p && p.then) {
        p.then(makeCallback(promise, l), reason => promise._reject(reason));
      } else {
        promise._callResolve(p, l);
      }
    }
  }

  function makeCallback(promise, index) {
    return function(value) {
      promise._callResolve(value, index);
    };
  }
};
