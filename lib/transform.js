'use strict';

const AigleCore = require('aigle-core');
const { Aigle, AigleProxy } = require('./aigle');
const { clone } = require('./internal/util');
const { errorObj, call3, makeCallResolve, makeReject } = require('./internal/util');

class TransformArray extends AigleProxy {

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
    this._result = result;
    this._iterate();
  }

  _iterate() {
    let i = -1;
    const { _rest, _array, _iterator, _result } = this;
    while (++i < _rest) {
      const p = call3(_iterator, _result, _array[i], i);
      if (p === errorObj) {
        this._reject(errorObj.e);
        return;
      }
      if (p instanceof AigleCore) {
        switch (p._resolved) {
        case 0:
          p._addReceiver(this, i);
          continue;
        case 1:
          this._callResolve(p._value, i);
          continue;
        case 2:
          this._reject(p._value);
          return;
        }
      }
      if (p && p.then) {
        p.then(makeCallResolve(this, i), makeReject(this));
      } else {
        this._callResolve(p, i);
      }
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      if (this._resolved !== 0) {
        return;
      }
      this._resolve(clone(this._result));
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class TransformObject extends AigleProxy {

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
    this._result = result;
    this._iterate();
  }

  _iterate() {
    let i = -1;
    const { _rest, _object, _keys, _iterator, _result } = this;
    while (++i < _rest) {
      const key = _keys[i];
      const p = call3(_iterator, _result, _object[key], key);
      if (p === errorObj) {
        this._reject(errorObj.e);
        return;
      }
      if (p instanceof AigleCore) {
        switch (p._resolved) {
        case 0:
          p._addReceiver(this, key);
          continue;
        case 1:
          this._callResolve(p._value, key);
          continue;
        case 2:
          this._reject(p._value);
          return;
        }
      }
      if (p && p.then) {
        p.then(makeCallResolve(this, key), makeReject(this));
      } else {
        this._callResolve(p, key);
      }
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      if (this._resolved !== 0) {
        return;
      }
      this._resolve(clone(this._result));
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = transform;

function transform(collection, result, iterator) {
  if (Array.isArray(collection)) {
    if (iterator === undefined && typeof result === 'function') {
      iterator = result;
      result = [];
    }
    return new TransformArray(collection, iterator, result);
  }
  if (collection && typeof collection === 'object') {
    if (iterator === undefined && typeof result === 'function') {
      iterator = result;
      result = {};
    }
    return new TransformObject(collection, iterator, result);
  }
  return Aigle.resolve(arguments.length === 2 ? {} : result);
}
