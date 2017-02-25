'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { clone } = require('./internal/util');
const { INTERNAL, call3, callProxyReciever } = require('./internal/util');

class TransformArray extends AigleProxy {

  constructor(array, iterator, result) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    let i = -1;
    while (++i < size && callProxyReciever(call3(iterator, result, array[i], i), this, i)) {}
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class TransformObject extends AigleProxy {

  constructor(object, iterator, result) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    let i = -1;
    while (++i < size) {
      const key = keys[i];
      if (callProxyReciever(call3(iterator, result, object[key], key), this, i) === false) {
        break;
      }
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = transform;

/**
 * @param {Array|Object} collection
 * @param {Array|Object|Function} [accumulator]
 * @param {Function} iterator
 */
function transform(collection, accumulator, iterator) {
  if (Array.isArray(collection)) {
    if (iterator === undefined && typeof accumulator === 'function') {
      iterator = accumulator;
      accumulator = [];
    }
    return new TransformArray(collection, iterator, accumulator)._promise;
  }
  if (collection && typeof collection === 'object') {
    if (iterator === undefined && typeof accumulator === 'function') {
      iterator = accumulator;
      accumulator = {};
    }
    return new TransformObject(collection, iterator, accumulator)._promise;
  }
  return Aigle.resolve(arguments.length === 2 ? {} : accumulator);
}
