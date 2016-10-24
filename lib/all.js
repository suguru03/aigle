'use strict';

const util = require('./internal/util');
const { InnerReceiver } = require('./internal/receiver');

module.exports = function(Promise) {

  return function all(array) {
    let size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    const promise = new Promise(util.noop);
    const { _callResolve, _callReject } = promise;
    let called = false;
    const callResolve = (value, index) => {
      result[index] = value;
      if (--size === 0) {
        _callResolve(result);
      }
    };
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
        case 0:
          p._receiver = new InnerReceiver(index, callResolve, callReject);
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
        callResolve(p, index);
        return;
      }
      p.then(value => callResolve(value, index), callReject);
    }
  };
};
