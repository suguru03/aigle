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
    const ctx = options.context === undefined ? options.context : undefined;
    func.__promisified__ = true;
    return func;

    function func(arg1, arg2) {
      const promise = new Promise(noop);
      let l = arguments.length;
      switch (l) {
      case 0:
        ctx ? fn.call(ctx, callback) : fn(callback);
        break;
      case 1:
        ctx ? fn.call(ctx, arg1, callback) : fn(arg1, callback);
        break;
      case 2:
        ctx ? fn.call(ctx, arg1, arg2, callback) : fn(arg1, arg2, callback);
        break;
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        args[args.length] = (err, res) => {
          if (err) {
            promise._callReject(err);
          } else {
            promise._callResolve(res);
          }
        };
        fn.apply(ctx, args);
        break;
      }
      return promise;

      function callback(err, res) {
        if (err) {
          promise._callReject(err);
        } else {
          promise._callResolve(res);
        }
      }
    }
  };
};

function isPromisified(fn) {
  return fn.__promisified___ === true;
}
