'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('../aigle');
const { errorObj, call2, makeCallResolve, makeReject } = require('./util');

class AigleEachArray extends AigleProxy {

  constructor(array, iterator) {
    super();
    const size = array.length;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._rest = size;
    this._result = Array(size);
    this._iterate(iterator, array, size);
  }

  _iterate(iterator, array, size) {
    let i = -1;
    while (++i < size) {
      const p = call2(iterator, array[i], i);
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

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class AigleEachObject extends AigleProxy {

  constructor(object, iterator) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._rest = size;
    this._result = {};
    this._iterate(iterator, object, keys, size);
  }

  _iterate(iterator, object, keys, size) {
    let i = -1;
    while (++i < size) {
      const key = keys[i];
      const p = call2(iterator, object[key], key);
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

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = { AigleEachArray, AigleEachObject };
