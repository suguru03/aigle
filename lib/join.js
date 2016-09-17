'use strict';

const util = require('./internal/util');

module.exports = function(Promise) {

  return function join() {
    let size = arguments.length;
    const promise = new Promise(util.noop);
    if (size === 0) {
      promise._resolved = 1;
      return promise;
    }
    const fn = arguments[--size];
    let index = -1;
    const result = Array(size);
    const callResolve = promise._callResolve;
    const callReject = promise._callReject;
    const taskSize = size;
    const callFunc = () => {
      let p;
      switch (taskSize) {
      case 0:
        p = fn();
        break;
      case 1:
        p = fn.call(null, result[0]);
        break;
      case 2:
        p = fn.call(null, result[0], result[1]);
        break;
      default:
        p = fn.apply(null, result);
        break;
      }
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 1:
          return callResolve(p._value);
        case 2:
          return callReject(p._value);
        }
      }
      if (!p || !p.then) {
        return callResolve(p);
      }
      p.then(callResolve, callReject);
    };
    while (++index < size) {
      iterator(arguments[index], index);
    }
    if (taskSize === 0) {
      callFunc();
    }
    return promise;

    function iterator(p, index) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 1:
          result[index] = p._value;
          if (--size === 0) {
            callFunc();
          }
          return;
        case 2:
          return callReject(p._value);
        }
      }
      if (!p || !p.then) {
        result[index] = p;
        if (--size === 0) {
          callFunc();
        }
        return;
      }
      p.then(value => {
        result[index] = value;
        if (--size === 0) {
          callFunc();
        }
      }, callReject);
    }
  };
};
