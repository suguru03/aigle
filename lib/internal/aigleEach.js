'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('../aigle');
const { INTERNAL, call2, callProxyReciever } = require('./util');

class AigleEachArray extends AigleProxy {

  constructor(array, iterator) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  _iterate() {
    const { _rest, _iterator, _array } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      let i = -1;
      while (++i < _rest && callProxyReciever(call2(_iterator, _array[i], i), this, i)) {}
    }
    return this._promise;
  }

  _callResolve(value) {
    if (--this._rest === 0 || value === false) {
      this._promise._resolve();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class AigleEachObject extends AigleProxy {

  constructor(object, iterator) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
  }

  _iterate() {
    const { _rest, _iterator, _keys, _object } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      let i = -1;
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
    if (--this._rest === 0 || value === false) {
      this._promise._resolve();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { AigleEachArray, AigleEachObject };
