'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, call3, callProxyReciever } = require('./internal/util');

class ReduceArray {

  constructor(array, iterator, result) {
    const size = array.length;
    this.__AIGLE_PROXY__ = true;
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

class ReduceObject {

  constructor(object, iterator, result) {
    const keys = Object.keys(object);
    const size = keys.length;
    this.__AIGLE_PROXY__ = true;
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

function reduce(collection, result, iterator) {
  if (iterator === undefined && typeof result === 'function') {
    iterator = result;
    result = undefined;
  }
  if (Array.isArray(collection)) {
    return new ReduceArray(collection, iterator, result)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new ReduceObject(collection, iterator, result)._promise;
  }
  return Aigle.resolve(result);
}
