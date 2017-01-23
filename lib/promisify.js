'use strict';

const { INTERNAL } = require('./internal/util');

module.exports = function(Promise) {

  return promisify;

  function promisify(fn, opts) {
    switch (typeof fn) {
    case 'object':
      switch (typeof opts) {
      case 'string':
      case 'number':
        return makeFunctionByKey(fn, opts);
      default:
        throw new TypeError('Second argument is invalid');
      }
    case 'function':
      const ctx = opts && opts.context !== undefined ? opts.context : undefined;
      return makeFunction(fn, ctx);
    default:
      throw new TypeError('Type of first argument is not function');
    }
  }

  function makeCallback(promise) {
    return (err, res) => {
      if (err) {
        promise._reject(err);
      } else {
        promise._resolve(res);
      }
    };
  }

  function makeFunctionByKey(obj, key) {

    return promisified;

    function promisified(arg) {
      const promise = new Promise(INTERNAL);
      const callback = makeCallback(promise);
      let l = arguments.length;
      switch (l) {
      case 0:
        obj[key](callback);
        break;
      case 1:
        obj[key](arg, callback);
        break;
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        args[args.length] = callback;
        obj[key].apply(obj, args);
        break;
      }
      return promise;
    }
  }

  function makeFunction(fn, ctx) {

    return promisified;

    function promisified(arg) {
      const promise = new Promise(INTERNAL);
      const callback = makeCallback(promise);
      let l = arguments.length;
      switch (l) {
      case 0:
        ctx ? fn.call(ctx, callback) : fn(callback);
        break;
      case 1:
        ctx ? fn.call(ctx, arg, callback) : fn(arg, callback);
        break;
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        args[args.length] = callback;
        fn.apply(ctx, args);
        break;
      }
      return promise;
    }
  }
};
