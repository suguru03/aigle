'use strict';

const { INTERNAL } = require('./internal/util');

module.exports = function(Promise) {

  return function all(array) {
    if (array.length === 0) {
      return Promise.resolve([]);
    }
    const promise = new Promise(INTERNAL);
    let l = array.length;
    const result = Array(l);
    let rest = l;
    while (l--) {
      const p = array[l];
      if (p instanceof Promise) {
        switch (p._resolve) {
        case 0:
          p._addReceiver(promise, makeCallResolve(l), promise._callReject, l);
          continue;
        case 1:
          result[l] = p._value;
          if (--rest === 0) {
            promise._resolve(result);
          }
          continue;
        case 2:
          promise._reject(p._value);
          return;
        }
      }
      if (p && p.then) {
        p.then(makeCallResolve(l), promise._callReject);
      } else {
        result[l] = p;
        if (--rest === 0) {
          promise._resolve(result);
        }
      }
    }
    return promise;

    function makeCallResolve(index) {
      return value => {
        result[index] = value;
        if (--rest === 0) {
          promise._resolve(result);
        }
      };
    }
  };
};
