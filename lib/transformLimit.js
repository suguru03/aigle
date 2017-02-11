'use strict';

const AigleCore = require('aigle-core');
const { Aigle, AigleProxy, push } = require('./aigle');
const {
  DEFAULT_LIMIT,
  DummyPromise,
  errorObj,
  call3,
  makeCallResolve,
  makeReject,
  clone
} = require('./internal/util');

class TransformLimitArray extends AigleProxy {

  constructor(array, iterator, result, limit) {
    super();
    const size = array.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._resolve(result);
      return;
    }
    limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._iterator = iterator;
    this._result = result;
    while (limit--) {
      this._next();
    }
  }

  _next() {
    let index = this._index++;
    const promise = call3(this._iterator, this._result, this._array[index], index);
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
      promise.then(makeCallResolve(this, index), makeReject(this));
    } else {
      push(new DummyPromise(promise, index), this);
    }
  }

  _callResolve(bool) {
    if (this._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

class TransformLimitObject extends AigleProxy {

  constructor(object, iterator, result, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._resolve(result);
      return;
    }
    limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    this._result = result;
    while (limit--) {
      this._next();
    }
  }

  _next() {
    const key = this._keys[this._index++];
    const promise = call3(this._iterator, this._result, this._object[key], key);
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
      promise.then(makeCallResolve(this, key), makeReject(this));
    } else {
      push(new DummyPromise(promise, key), this);
    }
  }

  _callResolve(bool) {
    if (this._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = transformLimit;

function transformLimit(collection, limit, result, iterator) {
  if (iterator === undefined) {
    if (typeof result === 'function') {
      iterator = result;
      result = undefined;
    } else if (typeof limit === 'function') {
      iterator = limit;
      result = undefined;
      limit = undefined;
    }
  }
  const isArray = Array.isArray(collection);
  if (typeof limit === 'object' && result === undefined) {
    result = limit;
    limit = DEFAULT_LIMIT;
  } else if (limit === undefined) {
    limit = DEFAULT_LIMIT;
  }
  if (result === undefined) {
    result = isArray ? [] : {};
  }
  if (isArray) {
    return new TransformLimitArray(collection, iterator, result, limit);
  }
  if (collection && typeof collection === 'object') {
    return new TransformLimitObject(collection, iterator, result, limit);
  }
  return Aigle.resolve(result);
}
