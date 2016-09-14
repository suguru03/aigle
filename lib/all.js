'use strict';

const util = require('./internal/util');

module.exports = function(Promise) {

  return function all(array) {
    let size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    const promise = new Promise(util.noop);
    const callResolve = promise._callResolve;
    const _callReject = promise._callReject;
    let called = false;
    const callReject = reason => {
      if (called) {
        return;
      }
      called = true;
      _callReject(reason);
    };
    util.forEach(array, iterator);
    return promise;

    function iterator(p, index) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 1:
          result[index] = p._value;
          if (--size === 0) {
            callResolve(result);
          }
          return;
        case 2:
          return callReject(p._value);
        }
      }
      if (!p || !p.then) {
        result[index] = p;
        if (--size === 0) {
          callResolve(result);
        }
        return;
      }
      p.then(value => {
        result[index] = value;
        if (--size === 0) {
          callResolve(result);
        }
      }, callReject);
    }
  };
};
