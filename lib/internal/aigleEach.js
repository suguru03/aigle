'use strict';

const { AigleProxy } = require('../aigle');
const { call2, callProxyReciever } = require('./util');

class AigleEachArray extends AigleProxy {

  constructor(array, iterator) {
    super();
    const size = array.length;
    this._rest = size;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._array = array;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _array } = this;
    while (++i < _rest && callProxyReciever(call2(_iterator, _array[i], i), this, i)) {}
    return this;
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

class AigleEachObject extends AigleProxy {

  constructor(object, iterator) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._rest = size;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _keys, _object } = this;
    while (++i < _rest) {
      const key = _keys[i];
      if (callProxyReciever(call2(_iterator, _object[key], key), this, i) === false) {
        break;
      }
    }
    return this;
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

module.exports = { AigleEachArray, AigleEachObject };
