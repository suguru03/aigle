'use strict';

const util = require('./internal/util');
const noop = util.noop;
const forEach = util.forEach;

module.exports = function(Promise) {

  return function race(array) {
    if (array.length === 0) {
      return Promise.resolve();
    }
    const promise = new Promise(noop);
    let called = false;
    const callResolve = value => {
      if (called) {
        return;
      }
      called = true;
      promise._callResolve(value);
    };
    const callReject = error => {
      if (called) {
        return;
      }
      called = true;
      promise._callReject(error);
    };
    forEach(array, iterator);
    return promise;
    function iterator(p) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 1:
          return callResolve(p._value);
        case 2:
          return callReject(p._value);
        }
      }
      p.then(callResolve, callReject);
    }
  };
};

