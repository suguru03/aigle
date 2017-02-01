'use strict';

const AigleCore = require('aigle-core');
const { Aigle, AigleProxy, push } = require('./aigle');
const { errorObj, call2, makeResolve, makeReject } = require('./internal/util');
const DEFAULT_LIMIT = 8;

class EachLimitArray extends AigleProxy {

  constructor(array, iterator, limit) {
    super();
    const size = array.length;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._index = -1;
    this._rest = size;
    this._size = size - 1;
    this._array = array;
    this._iterator = iterator;
    while (limit--) {
      this._iterate();
    }
  }

  _iterate() {
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
      push(Aigle.resolve(promise), this);
    }
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._iterate();
    }
  }
}

class EachLimitObject extends AigleProxy {

  constructor(object, iterator, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._index = -1;
    this._rest = size;
    this._size = size - 1;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    while (limit--) {
      this._iterate();
    }
  }

  _iterate() {
    const key = this._keys[++this._index];
    const promise = call2(this._iterator, this._object[key], key);
    if (promise === errorObj) {
      this._reject(errorObj.e);
      return;
    }
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(this, key);
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
      push(Aigle.resolve(promise), this);
    }
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._iterate();
    }
  }
}

module.exports = eachLimit;

function eachLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new EachLimitArray(collection, iterator, limit);
  }
  if (collection && typeof collection === 'object') {
    return new EachLimitObject(collection, iterator, limit);
  }
  return Aigle.resolve();
}

