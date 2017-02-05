'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('../aigle');
const { errorObj, call2, makeCallResolve, makeReject } = require('./util');

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
    const { _rest, _array, _iterator } = this;
    while (++i < _rest) {
      const p = call2(_iterator, _array[i], i);
      if (p === errorObj) {
        this._reject(errorObj.e);
        return this;
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
          return this;
        }
      }
      if (p && p.then) {
        p.then(makeCallResolve(this, i), makeReject(this));
      } else {
        this._callResolve(p, i);
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
    const { _rest, _keys, _object, _iterator } = this;
    while (++i < _rest) {
      const key = _keys[i];
      const p = call2(_iterator, _object[key], key);
      if (p === errorObj) {
        this._reject(errorObj.e);
        return this;
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
          return this;
        }
      }
      if (p && p.then) {
        p.then(makeCallResolve(this, i), makeReject(this));
      } else {
        this._callResolve(p, i);
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
