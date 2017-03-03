'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL } = require('./internal/util');

module.exports = promisify;

/**
 * @param {Object|Function} fn
 * @param {string|number|Object} [fn]
 * @param {Object} [fn.context]
 */
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
    const promise = new Aigle(INTERNAL);
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
    const promise = new Aigle(INTERNAL);
    const callback = makeCallback(promise);
    let l = arguments.length;
    switch (l) {
    case 0:
      fn.call(ctx || this, callback);
      break;
    case 1:
      fn.call(ctx || this, arg, callback);
      break;
    default:
      const args = Array(l);
      while (l--) {
        args[l] = arguments[l];
      }
      args[args.length] = callback;
      fn.apply(ctx || this, args);
      break;
    }
    return promise;
  }
}
