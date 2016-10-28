'use strict';

const { noop } = require('./internal/util');
const { Receiver, InnerReceiver } = require('./internal/receiver');

module.exports = function(Promise, callResolve, callReject) {

  return function join() {
    let size = arguments.length;
    const promise = new Promise(noop);
    if (size === 0) {
      promise._resolved = 1;
      return promise;
    }
    const fn = arguments[--size];
    const result = Array(size);
    const resolve = value => callResolve(promise, value);
    const reject = reason => callReject(promise, reason);
    const callFunc = () => {
      let p;
      switch (result.length) {
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
        case 0:
          p._receiver = new Receiver(promise, resolve, reject);
          return;
        case 1:
          return callResolve(promise, p._value);
        case 2:
          return callReject(promise, p._value);
        }
      }
      if (!p || !p.then) {
        return callResolve(promise, p);
      }
      p.then(resolve, reject);
    };

    const _callResolve = (value, index) => {
      result[index] = value;
      if (--size === 0) {
        callFunc();
      }
    };
    let called = false;
    const _callReject = reason => {
      if (called) {
        return;
      }
      called = true;
      callReject(promise, reason);
    };

    let index = -1;
    while (++index < result.length) {
      iterator(arguments[index], index);
    }
    if (result.length === 0) {
      callFunc();
    }
    return promise;

    function iterator(p, index) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 0:
          p._receiver = new InnerReceiver(index, _callResolve, _callReject);
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
        _callResolve(p, index);
        return;
      }
      p.then(value => _callResolve(value, index), _callReject);
    }
  };
};
