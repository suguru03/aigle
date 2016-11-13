'use strict';

const { InnerReceiver } = require('./internal/receiver');
const { internal } = require('./internal/util');

module.exports = function(Promise, callResolve, callReject) {

  function makeCallResolve(promise) {
    let called = 0;
    const size = promise._size;
    const result = Array(size);
    return (value, index) => {
      if (promise._err) {
        return;
      }
      result[index] = value;
      if (++called === size) {
        callResolve(promise, result);
      }
    };
  }
  function makeCallReject(promise) {
    return reason => {
      if (promise._err) {
        return;
      }
      promise._err = reason;
      callReject(promise, reason);
    };
  }

  class PromiseArray extends Promise {
    constructor(array) {
      super(internal);
      const size = array.length;
      this._err = undefined;
      this._size = size;
      this._callResolve = makeCallResolve(this);
      this._callReject = makeCallReject(this);
      let index = -1;
      while (++index < size) {
        this._iterator(array[index], index);
      }
    }
    _iterator(p, index) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 0:
          p._receiver = new InnerReceiver(index, this._callResolve, this._callReject);
          return;
        case 1:
          this._callResolve(p._value, index);
          return;
        case 2:
          this._callReject(p._value);
          return;
        }
      }
      if (!p || !p.then) {
        this._callResolve(p, index);
        return;
      }
      p.then(value => this._callResolve(value, index), this._callReject);
    }

  }

  return function all(array) {
    return new PromiseArray(array);
  };
};
