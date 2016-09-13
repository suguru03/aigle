'use strict';

const util = require('./util');

module.exports = function(Promise) {

  return function all(array) {
    let size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    const promise = new Promise(util.noop);
    const callResolve = promise._callResolve;
    let called = false;
    const callReject = error => {
      if (called) {
        return;
      }
      called = true;
      promise._callReject(error);
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
