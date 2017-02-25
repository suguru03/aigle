'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('../aigle');
const { INTERNAL, DEFAULT_LIMIT, call2, callProxyReciever } = require('./util');

class AigleLimitArray extends AigleProxy {

  constructor(array, iterator, limit) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  _iterate() {
    if (this._limit >= 1) {
      while (this._limit--) {
        this._next();
      }
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call2(this._iterator, this._array[i], i), this, i);
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 && this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._promise._resolved === 0 && this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class AigleLimitObject extends AigleProxy {

  constructor(object, iterator, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._keys = keys;
    this._rest = size;
    this._size = size;
    this._object = object;
    this._result = undefined;
    this._iterator = iterator;
  }

  _iterate() {
    if (this._limit >= 1) {
      while (this._limit--) {
        this._next();
      }
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  }

  _next() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call2(this._iterator, this._object[key], key), this, i);
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 && this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._promise._resolved === 0 && this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject };
