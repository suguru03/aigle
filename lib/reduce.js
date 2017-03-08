'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, call3, callProxyReciever } = require('./internal/util');

class ReduceArray extends AigleProxy {

  constructor(array, iterator, result) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._iterator = iterator;
    if (size === 0) {
      this._promise._resolve(result);
    } else if (result === undefined) {
      this._callResolve(array[0], 0);
    } else {
      this._next(0, result);
    }
  }

  _next(index, result) {
    callProxyReciever(call3(this._iterator, result, this._array[index], index), this, index);
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._next(++index, result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class ReduceObject extends AigleProxy {

  constructor(object, iterator, result) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    if (size === 0) {
      this._promise._resolve(result);
    } else if (result === undefined) {
      this._callResolve(object[keys[0]], 0);
    } else {
      this._next(0, result);
    }
  }

  _next(index, result) {
    const key = this._keys[index];
    callProxyReciever(call3(this._iterator, result, this._object[key], key), this, index);
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._next(++index, result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = reduce;

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {*} [result]
 * @example
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result + num);
 * };
 * return Aigle.reduce(collection, iterator, 1)
 *   .then(value => console.log(value)); // 8
 */
function reduce(collection, iterator, result) {
  if (Array.isArray(collection)) {
    return new ReduceArray(collection, iterator, result)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new ReduceObject(collection, iterator, result)._promise;
  }
  return Aigle.resolve(result);
}
