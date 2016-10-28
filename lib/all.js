'use strict';

const { forEach } = require('./internal/util');
const { InnerReceiver } = require('./internal/receiver');
const { internal } = require('./internal/util');

module.exports = function(Promise, callResolve, callReject) {

  return function all(array) {
    let size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    const promise = new Promise(internal);
    let called = false;
    const _callResolve = (value, index) => {
      result[index] = value;
      if (--size === 0) {
        callResolve(promise, result);
      }
    };
    const _callReject = reason => {
      if (called) {
        return;
      }
      called = true;
      callReject(promise, reason);
    };
    forEach(array, iterator);
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
