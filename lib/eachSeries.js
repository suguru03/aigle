'use strict';

const AigleCore = require('aigle-core');
const { Aigle, AigleProxy, push } = require('./aigle');
const { errorObj, call2, makeResolve, makeReject } = require('./internal/util');

class EachSeriesArray extends AigleProxy {

  constructor(array, iterator) {
    super();
    const size = array.length;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._index = -1;
    this._rest = size;
    this._array = array;
    this._iterator = iterator;
    this._iterate();
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
      promise._callResolve();
    }
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else {
      this._iterate();
    }
  }
}

class EachSeriesObject extends AigleProxy {

  constructor(object, iterator) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._index = -1;
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    this._iterate();
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
      promise._callResolve();
    }
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else {
      this._iterate();
    }
  }
}

module.exports = eachSeries;

function eachSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new EachSeriesArray(collection, iterator);
  }
  if (collection && typeof collection === 'object') {
    return new EachSeriesObject(collection, iterator);
  }
  return Aigle.resolve();
}

