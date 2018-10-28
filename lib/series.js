'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayIterator,
  promiseObjectIterator,
  promiseSetIterator,
  promiseMapIterator,
  iteratorSymbol
} = require('./internal/util');

class Series extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._index = -1;
    this._coll = undefined;
    this._keys = undefined;
    this._rest = undefined;
    this._result = undefined;
    this._iterator = undefined;
    if (coll === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(coll);
    }
  }

  _set(coll) {
    this._coll = coll;
    if (Array.isArray(coll)) {
      const size = coll.length;
      this._rest = size;
      this._result = Array(size);
      this._callResolve = callResolve;
      this._iterator = promiseArrayIterator;
    } else if (typeof coll !== 'object' || coll === null) {
      this._rest = 0;
      this._result = undefined;
    } else if (coll[iteratorSymbol]) {
      this._coll = coll[iteratorSymbol]();
      const size = coll.size;
      this._rest = size;
      if (coll instanceof Map) {
        const result = new Map();
        this._result = result;
        this._callResolve = callResolveMap;
        this._iterator = promiseMapIterator;
      } else {
        this._result = [];
        this._callResolve = callResolve;
        this._iterator = promiseSetIterator;
      }
    } else {
      const result = {};
      const keys = Object.keys(coll);
      this._rest = keys.length;
      this._keys = keys;
      this._result = result;
      this._callResolve = callResolve;
      this._iterator = promiseObjectIterator;
    }
    this._iterate();
    return this;
  }

  _execute() {
    return this._promise;
  }

  _iterate() {
    if (++this._index === this._rest) {
      this._promise._resolve(this._result);
    } else {
      this._iterator(this, this._coll, this._index, this._result, this._keys);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { series, Series };

function callResolve(value, key) {
  this._result[key] = value;
  this._iterate();
}

function callResolveMap(value, key) {
  this._result.set(key, value);
  this._iterate();
}

function series(collection) {
  return new Series(collection)._promise;
}
