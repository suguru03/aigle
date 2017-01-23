'use strict';

const { INTERNAL } = require('./internal/util');

module.exports = function(Promise) {

  const receiver = new Promise(INTERNAL);

  return all;

  function all(array) {
    if (array.length === 0) {
      return Promise.resolve([]);
    }
    const promise = new Promise(INTERNAL);
    promise._array = true;
    const { _resolve } = promise;
    let l = array.length;
    const result = Array(l);
    let rest = l;
    promise._resolve = (value, index) => {
      result[index] = value;
      if (--rest === 0) {
        _resolve.call(promise, result);
      }
    };
    while (l--) {
      const p = array[l];
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 0:
          p._key = l;
          p._addReceiver(receiver, promise._resolve, promise._callReject);
          continue;
        case 1:
          promise._resolve(p._value, l);
          continue;
        case 2:
          promise._reject(p._value);
          return;
        }
      }
      if (p && p.then) {
        p.then(makeCallResolve(promise, l), promise._callReject);
      } else {
        promise._resolve(p, l);
      }
    }
    return promise;
  }

  function makeCallResolve(promise, index) {
    return value => promise._resolve(value, index);
  }
};
