'use strict';

const { Aigle } = require('../aigle');
const { INTERNAL, call2, callProxyReciever } = require('./util');

class AigleEachArray {

  constructor(array, iterator) {
    const size = array.length;
    this.__AIGLE_PROXY__ = true;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _array } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (++i < _rest && callProxyReciever(call2(_iterator, _array[i], i), this, i)) {}
    }
    return this._promise;
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 & this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class AigleEachObject {

  constructor(object, iterator) {
    const keys = Object.keys(object);
    const size = keys.length;
    this.__AIGLE_PROXY__ = true;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _keys, _object } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (++i < _rest) {
        const key = _keys[i];
        if (callProxyReciever(call2(_iterator, _object[key], key), this, i) === false) {
          break;
        }
      }
    }
    return this._promise;
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 & this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { AigleEachArray, AigleEachObject };
