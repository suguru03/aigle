'use strict';

const { AigleProxy } = require('../aigle');
const { DEFAULT_LIMIT, call2, callProxyReciever } = require('./util');

class AigleLimitArray extends AigleProxy {

  constructor(array, iterator, limit) {
    super();
    const size = array.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._rest = 0;
      this._resolve();
      return;
    }
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._iterator = iterator;
  }

  _iterate() {
    if (this._resolved !== 0) {
      return this;
    }
    while (this._limit--) {
      this._next();
    }
    return this;
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call2(this._iterator, this._array[i], i), this, i);
  }

  _callResolve() {
    if (this._resolved !== 0) {
      return;
    }
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

class AigleLimitObject extends AigleProxy {

  constructor(object, iterator, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._rest = 0;
      this._resolve();
      return;
    }
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._keys = keys;
    this._rest = size;
    this._size = size;
    this._object = object;
    this._iterator = iterator;
  }

  _iterate() {
    if (this._resolved !== 0) {
      return this;
    }
    while (this._limit--) {
      this._next();
    }
    return this;
  }

  _next() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call2(this._iterator, this._object[key], key), this, i);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject };
