'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, DEFAULT_LIMIT, call3, callProxyReciever, clone } = require('./internal/util');

class TransformLimitArray extends AigleProxy {

  constructor(array, iterator, result = [], limit) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._promise._resolve(result);
      return;
    }
    limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._iterator = iterator;
    this._result = result;
    while (limit--) {
      this._next();
    }
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call3(this._iterator, this._result, this._array[i], i), this, i);
  }

  _callResolve(bool) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class TransformLimitObject extends AigleProxy {

  constructor(object, iterator, result = {}, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._promise._resolve(result);
      return;
    }
    limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    this._result = result;
    while (limit--) {
      this._next();
    }
  }

  _next() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call3(this._iterator, this._result, this._object[key], key), this, i);
  }

  _callResolve(bool) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = transformLimit;

/**
 * @param {Array|Object} collection
 * @param {integer} [limit]
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 */
function transformLimit(collection, limit, iterator, accumulator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new TransformLimitArray(collection, iterator, accumulator, limit)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new TransformLimitObject(collection, iterator, accumulator, limit)._promise;
  }
  return Aigle.resolve(accumulator || {});
}
