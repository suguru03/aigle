'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callThen } = require('./internal/util');

const globalSetImmediate = typeof setImmediate === 'function' ? setImmediate : {};
const custom =
  (() => {
    try {
      return require('util').promisify.custom;
    } catch (e) {
      return;
    }
  })() || {};

module.exports = promisify;

/**
 * @param {Object|Function} fn
 * @param {string|number|Object} [fn]
 * @param {Object} [fn.context]
 * @example
 * const func = (a, b, c, callback) => callback(null, a + b + c);
 * Aigle.promisify(func)(1, 2, 3)
 *   .then(value => console.log(value)); // 6
 *
 * @example
 * const obj = {
 *   val: 1,
 *   get(callback) {
 *     callback(null, this.val);
 *   }
 * };
 *
 * // using bind
 * Aigle.promisify(obj.get.bind(obj))().then(console.log);
 *
 * // using context
 * Aigle.promisify(obj.get, { context: obj })().then(console.log);
 *
 * // using shorthand
 * Aigle.promisify(obj, 'get')().then(console.log);
 */
function promisify(fn, opts) {
  switch (typeof fn) {
    case 'object':
      switch (typeof opts) {
        case 'string':
        case 'number':
          if (typeof fn[opts] !== 'function') {
            throw new TypeError('Function not found key: ' + opts);
          }
          if (fn[opts].__isPromisified__) {
            return fn[opts];
          }
          return makeFunctionByKey(fn, opts);
        default:
          throw new TypeError('Second argument is invalid');
      }
    case 'function':
      if (fn.__isPromisified__) {
        return fn;
      }
      const ctx = opts && opts.context !== undefined ? opts.context : undefined;
      return makeFunction(fn, ctx);
    default:
      throw new TypeError('Type of first argument is not function');
  }
}

/**
 * @private
 * @param {Aigle} promise
 */
function makeCallback(promise) {
  return (err, res) => (err ? promise._reject(err) : promise._resolve(res));
}

/**
 * @private
 * @param {Object} obj
 * @param {string} key
 */
function makeFunctionByKey(obj, key) {
  promisified.__isPromisified__ = true;
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

/**
 * @private
 * @param {function} fn
 * @param {*} [ctx]
 */
function makeFunction(fn, ctx) {
  const func = fn[custom];
  if (func) {
    nativePromisified.__isPromisified__ = true;
    return nativePromisified;
  }
  switch (fn) {
    case setTimeout:
      return Aigle.delay;
    case globalSetImmediate:
      return Aigle.resolve;
  }
  promisified.__isPromisified__ = true;
  return promisified;

  function nativePromisified(arg) {
    const promise = new Aigle(INTERNAL);
    let l = arguments.length;
    let p;
    switch (l) {
      case 0:
        p = func.call(ctx || this);
        break;
      case 1:
        p = func.call(ctx || this, arg);
        break;
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        p = func.apply(ctx || this, args);
        break;
    }
    callThen(p, promise);
    return promise;
  }

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
