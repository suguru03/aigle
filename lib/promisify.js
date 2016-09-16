'use strict';

const util = require('./internal/util');
const noop = util.noop;

module.exports = function(Promise) {

  return function promisify(fn, opts) {
    let ctx;
    let useKey;
    switch (typeof fn) {
    case 'object':
      useKey = true;
      break;
    case 'function':
      if (isPromisified(fn)) {
        return fn;
      }
      break;
    default:
      throw new TypeError('Type of first argument is not function');
    }
    if (useKey) {
      switch (typeof opts) {
      case 'string':
      case 'number':
        break;
      default:
        throw new TypeError('Second argument is invalid');
      }
    } else {
      ctx = opts && opts.context !== undefined ? opts.context : undefined;
    }
    func.__promisified__ = true;
    return func;

    function func(arg1, arg2) {
      const promise = new Promise(noop);
      let l = arguments.length;
      switch (l) {
      case 0:
        useKey ? fn[opts](callback) : ctx ? fn.call(ctx, callback) : fn(callback);
        break;
      case 1:
        useKey ? fn[opts](arg1, callback) : ctx ? fn.call(ctx, arg1, callback) : fn(arg1, callback);
        break;
      case 2:
        useKey ? fn[opts](arg1, arg2, callback) : ctx ? fn.call(ctx, arg1, arg2, callback) : fn(arg1, arg2, callback);
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
        useKey ? fn[opts].apply(fn, args) :fn.apply(ctx, args);
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
  return fn.__promisified__ === true;
}
