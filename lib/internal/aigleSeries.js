'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('../aigle');
const { INTERNAL, call2, callProxyReciever } = require('./util');

class AigleSeriesArray extends AigleProxy {

  constructor(array, iterator) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
    return this._promise;
  }


  _iterate() {
    const i = this._index++;
    callProxyReciever(call2(this._iterator, this._array[i], i), this, i);
  }

  _callResolve(value) {
    if (--this._rest === 0 || value === false) {
      this._promise._resolve();
    } else {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class AigleSeriesObject extends AigleProxy {

  constructor(object, iterator) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._keys = keys;
    this._rest = size;
    this._size = size;
    this._object = object;
    this._result = undefined;
    this._iterator = iterator;
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
    return this._promise;
  }

  _iterate() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call2(this._iterator, this._object[key], key), this, i);
  }

  _callResolve(value) {
    if (--this._rest === 0 || value === false) {
      this._promise._resolve();
    } else {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { AigleSeriesArray, AigleSeriesObject };
