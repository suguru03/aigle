'use strict';

const util = require('./util');
const noop = util.noop;

module.exports = function(Promise) {

  return function promisify(fn, options) {
    if (typeof fn !== 'function') {
      throw new TypeError('Type of first argument is not function');
    }
    if (isPromisified(fn)) {
      return fn;
    }
    const func = makeFunction(fn);
    return func;
  };

  function makeFunction(fn) {
    const l = fn.length;
    const promise = new Promise(noop);
    switch (l) {
    case 1:
      return function() {
        call0(fn, promise);
        return promise;
      };
    case 2:
      return function(arg) {
        call1(arg, fn, promise);
        return promise;
      };
    case 3:
      return function(arg1, arg2) {
        call2(arg1, arg2, fn, promise);
        return promise;
      };
    default:
      return function() {
        const args = Array(l);
        for (let i = 0; i < l; i++) {
          args[i] = arguments[i];
        }
        callArgs(args, fn, promise);
        return promise;
      };
    }
  }

};

function isPromisified(fn) {
  return fn.__promisified___ === true;
}

function call0(fn, promise) {
  fn((err, res) => {
    if (err) {
      promise._callReject(res);
    } else {
      promise._callResolve(res);
    }
  });
}

function call1(arg, fn, promise) {
  fn(arg, (err, res) => {
    if (err) {
      promise._callReject(res);
    } else {
      promise._callResolve(res);
    }
  });
}

function call2(arg1, arg2, fn, promise) {
  fn(arg1, arg2, (err, res) => {
    if (err) {
      promise._callReject(res);
    } else {
      promise._callResolve(res);
    }
  });
}

function callArgs(args, fn, promise) {
  args[args.length - 1] = (err, res) => {
    if (err) {
      promise._callReject(res);
    } else {
      promise._callResolve(res);
    }
  };
  fn.apply(null, args);
}
