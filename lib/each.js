'use strict';

const util = require('./util');
const noop = util.noop;
const forEach = util.forEach;

module.exports = function(Promise) {

  return function each(array) {
    let size = array.length;
    if (size === 0) {
      return Promise.resolve();
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
    function iterator(p) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 1:
          if (--size === 0) {
            callResolve();
          }
          return;
        case 2:
          return callReject(p._value);
        }
      }
      p.then(() => {
        if (--size === 0) {
          callResolve();
        }
      }, callReject);
    }
  };
};
