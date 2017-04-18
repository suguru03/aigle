'use strict';

const { AigleProxy } = require('aigle-core');

const { Aigle } = require('../aigle');
const { DEFAULT_LIMIT, INTERNAL, call2, callProxyReciever } = require('./util');

class AigleLimitArray extends AigleProxy {

  constructor(array, iterator, limit) {
    super();
    if (typeof limit === 'function') {
      iterator = limit;
      limit = DEFAULT_LIMIT;
    }
    const size = array.length;
    limit = limit > size ? size : limit;
    this._promise = new Aigle(INTERNAL);
    this._limit = limit;
    this._index = 0;
    this._rest = size;
    this._callRest = size - limit;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (this._limit--) {
        this._iterate();
      }
    }
    return this._promise;
  }

  _iterate() {
    const i = this._index++;
    callProxyReciever(call2(this._iterator, this._array[i], i), this, i);
  }

  _callResolve(value) {
    if (value === false) {
      this._callRest = 0;
      this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  }
}

class AigleLimitObject extends AigleProxy {

  constructor(object, iterator, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    limit = limit > size ? size : limit;
    this._promise = new Aigle(INTERNAL);
    this._limit = limit;
    this._index = 0;
    this._keys = keys;
    this._rest = size;
    this._callRest = size - limit;
    this._object = object;
    this._result = undefined;
    this._iterator = iterator;
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (this._limit--) {
        this._iterate();
      }
    }
    return this._promise;
  }

  _iterate() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call2(this._iterator, this._object[key], key), this, i);
  }

  _callResolve(value) {
    if (value === false) {
      this._callRest = 0;
      this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  }
}

module.exports = { AigleLimitArray, AigleLimitObject };
