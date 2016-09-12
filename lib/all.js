'use strict';

const util = require('./util');
const noop = util.noop;
const forEach = util.forEach;

module.exports = function(Promise) {

  return function all(array) {
    let size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    const promise = new Promise(noop);
    const callResolve = promise._callResolve;
    let called = false;
    const callReject = error => {
      if (called) {
        return;
      }
      called = true;
      promise._callReject(error);
    };
    forEach(array, iterator);
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
      p.then(value => {
        result[index] = value;
        if (--size === 0) {
          callResolve(result);
        }
      }, callReject);
    }
  };
};
