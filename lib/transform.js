'use strict';

const { Aigle, AigleProxy } = require('./aigle');
const { clone } = require('./internal/util');
const { call3, callProxyReciever } = require('./internal/util');

class TransformArray extends AigleProxy {

  constructor(array, iterator, result) {
    super();
    const size = array.length;
    if (size === 0) {
      this._resolve(result);
      return;
    }
    this._rest = size;
    this._array = array;
    this._iterator = iterator;
    this._result = result;
    this._iterate();
  }

  _iterate() {
    let i = -1;
    const { _rest, _array, _iterator, _result } = this;
    while (++i < _rest && callProxyReciever(call3(_iterator, _result, _array[i], i), this, i)) {}
  }

  _callResolve(bool) {
    if (bool === false) {
      this._resolved === 0 && this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class TransformObject extends AigleProxy {

  constructor(object, iterator, result) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0) {
      this._resolve(result);
      return;
    }
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    this._result = result;
    this._iterate();
  }

  _iterate() {
    let i = -1;
    const { _rest, _object, _keys, _iterator, _result } = this;
    while (++i < _rest) {
      const key = _keys[i];
      if (callProxyReciever(call3(_iterator, _result, _object[key], key), this, i) === false) {
        break;
      }
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._resolved === 0 && this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    }
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
    return new TransformArray(collection, iterator, accumulator);
  }
  if (collection && typeof collection === 'object') {
    if (iterator === undefined && typeof accumulator === 'function') {
      iterator = accumulator;
      accumulator = {};
    }
    return new TransformObject(collection, iterator, accumulator);
  }
  return Aigle.resolve(arguments.length === 2 ? {} : accumulator);
}
