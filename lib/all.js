'use strict';

const util = require('./internal/util');
const Receiver = require('./internal/receiver');

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
          p._receiver = new Receiver(undefined, value => {
            result[index] = value;
            if (--size === 0) {
              _callResolve(result);
            }
          }, callReject);
          return;
        case 1:
          result[index] = p._value;
          if (--size === 0) {
            _callResolve(result);
          }
          return;
        case 2:
          callReject(p._value);
          return;
        }
      }
      if (!p || !p.then) {
        result[index] = p;
        if (--size === 0) {
          _callResolve(result);
        }
        return;
      }
      p.then(value => {
        result[index] = value;
        if (--size === 0) {
          _callResolve(result);
        }
      }, callReject);
    }
  };
};
