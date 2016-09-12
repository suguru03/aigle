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
    options = options || {};
    const ctx = options.context === undefined ? options.context : null;
    const func = makeFunction(fn, ctx);
    func.__promisified__ = true;
    return func;
  };

  function makeFunction(fn, ctx) {
    return function(arg1, arg2) {
      const promise = new Promise(noop);
      ctx = ctx || this;
      let l = arguments.length;
      switch (l) {
      case 0:
        return call1(fn, promise, ctx);
      case 1:
        return call2(arg1, fn, promise, ctx);
      case 2:
        return call3(arg1, arg2, fn, promise, ctx);
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        return callArgs(args, fn, promise, ctx);
      }
    };
  }

};

function isPromisified(fn) {
  return fn.__promisified___ === true;
}

function call1(fn, promise, ctx) {
  ctx ? fn(callback) : fn.call(ctx, callback);
  return promise;
  function callback(err, res) {
    if (err) {
      promise._callReject(err);
    } else {
      promise._callResolve(res);
    }
  }
}

function call2(arg, fn, promise, ctx) {
  ctx ? fn(arg, callback) : fn.call(ctx, arg, callback);
  return promise;
  function callback(err, res) {
    if (err) {
      promise._callReject(err);
    } else {
      promise._callResolve(res);
    }
  }
}

function call3(arg1, arg2, fn, promise, ctx) {
  ctx ? fn(arg1, arg2, callback) : fn.call(ctx, arg1, arg2, callback);
  return promise;
  function callback(err, res) {
    if (err) {
      promise._callReject(err);
    } else {
      promise._callResolve(res);
    }
  }
}

function callArgs(args, fn, promise, ctx) {
  args[args.length] = (err, res) => {
    if (err) {
      promise._callReject(err);
    } else {
      promise._callResolve(res);
    }
  };
  fn.apply(ctx, args);
  return promise;
}
