'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy, push } = require('../aigle');
const { errorObj, call2, makeResolve, makeReject } = require('./util');
const DEFAULT_LIMIT = 8;

class AigleLimitArray extends AigleProxy {

  constructor(array, iterator, limit) {
    super();
    const size = array.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._resolve();
      return;
    }
    this._limit = limit > size ? size : limit;
    this._index = -1;
    this._rest = size;
    this._size = size - 1;
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
    const index = ++this._index;
    const promise = call2(this._iterator, this._array[index], index);
    if (promise === errorObj) {
      this._reject(errorObj.e);
      return;
    }
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(this, index);
        return;
      case 1:
        push(promise, this);
        return;
      case 2:
        this._reject(promise._value);
        return;
      }
    }
    if (promise && promise.then) {
      promise.then(makeResolve(this), makeReject(this));
    } else {
      push(new DummyPromise(promise, index), this);
    }
    return;
  }

  _callResolve() {
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
      this._resolve();
      return;
    }
    this._limit = limit > size ? size : limit;
    this._index = -1;
    this._keys = keys;
    this._rest = size;
    this._size = size - 1;
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
    const index = ++this._index;
    const key = this._keys[index];
    const promise = call2(this._iterator, this._object[key], key);
    if (promise === errorObj) {
      this._reject(errorObj.e);
      return this;
    }
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(this, index);
        return this;
      case 1:
        push(promise, this);
        return this;
      case 2:
        this._reject(promise._value);
        return this;
      }
    }
    if (promise && promise.then) {
      promise.then(makeResolve(this), makeReject(this));
    } else {
      push(new DummyPromise(promise, index), this);
    }
    return this;
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

class DummyPromise {

  constructor(value, key) {
    this._resolved = 1;
    this._key = key;
    this._value = value;
  }
}

module.exports = { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject };
