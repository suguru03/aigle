'use strict';

const AigleCore = require('aigle-core');
const { Aigle, AigleProxy, push } = require('./aigle');
const { DummyPromise, errorObj, call3, makeResolve, makeReject } = require('./internal/util');

class ReduceArray extends AigleProxy {

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
    if (result === undefined) {
      this._callResolve(array[0], 0);
    } else {
      this._next(0, result);
    }
  }

  _next(index, result) {
    const promise = call3(this._iterator, result, this._array[index], index);
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
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._resolve(result);
    } else {
      this._next(++index, result);
    }
  }
}

class ReduceObject extends AigleProxy {

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
    if (result === undefined) {
      this._callResolve(object[keys[0]], 0);
    } else {
      this._next(0, result);
    }
  }

  _next(index, result) {
    const key = this._keys[index];
    const promise = call3(this._iterator, result, this._object[key], key);
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
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._resolve(result);
    } else {
      this._next(++index, result);
    }
  }
}

module.exports = reduce;

function reduce(collection, result, iterator) {
  if (iterator === undefined && typeof result === 'function') {
    iterator = result;
    result = undefined;
  }
  if (Array.isArray(collection)) {
    return new ReduceArray(collection, iterator, result);
  }
  if (collection && typeof collection === 'object') {
    return new ReduceObject(collection, iterator, result);
  }
  return Aigle.resolve(result);
}
