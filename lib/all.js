'use strict';

const { InnerReceiver } = require('./internal/receiver');
const { internal } = require('./internal/util');

module.exports = function(Promise, callResolve, callReject) {

  return function all(array) {
    const size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    const promise = new Promise(internal);
    let called = 0;
    const _callResolve = (value, index) => {
      result[index] = value;
      if (++called === size) {
        callResolve(promise, result);
      }
    };
    let err;
    const _callReject = reason => {
      if (err) {
        return;
      }
      err = reason;
      callReject(promise, reason);
    };
    let index = -1;
    while (++index < size) {
      iterator(array[index], index);
    }
    return promise;

    function iterator(p, index) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 0:
          p._receiver = new InnerReceiver(index, _callResolve, _callReject);
          return;
        case 1:
          callResolve(p._value, index);
          return;
        case 2:
          callReject(p._value);
          return;
        }
      }
      if (!p || !p.then) {
        _callResolve(p, index);
        return;
      }
      p.then(value => _callResolve(value, index), _callReject);
    }
  };
};
