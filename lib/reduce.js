'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { execute, setSeries } = require('./internal/collection');
const { INTERNAL, PENDING, call3, callProxyReciever } = require('./internal/util');

class Reduce extends AigleProxy {
  constructor(collection, iterator, result) {
    super();
    this._result = result;
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._coll = undefined;
    this._rest = undefined;
    this._size = undefined;
    this._keys = undefined;
    this._iterate = undefined;
    if (collection === PENDING) {
      this._set = set;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, collection);
    }
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._iterate(++index, result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { reduce, Reduce };

function set(collection) {
  setSeries.call(this, collection);
  if (this._keys === undefined) {
    this._iterate = iterateArray;
    this._execute = executeArray;
  } else {
    this._iterate = iterateObject;
    this._execute = executeObject;
  }
  return this;
}

function iterateArray(index, result) {
  callProxyReciever(call3(this._iterator, result, this._coll[index], index), this, index);
}

function iterateObject(index, result) {
  const key = this._keys[index];
  callProxyReciever(call3(this._iterator, result, this._coll[key], key), this, index);
}

function executeArray() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._result === undefined) {
    this._callResolve(this._coll[0], 0);
  } else {
    this._iterate(0, this._result);
  }
  return this._promise;
}

function executeObject() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._result === undefined) {
    this._callResolve(this._coll[this._keys[0]], 0);
  } else {
    this._iterate(0, this._result);
  }
  return this._promise;
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {*} [result]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result + num);
 * };
 * return Aigle.reduce(collection, iterator, 1)
 *   .then(value => console.log(value)); // 8
 *
 * @example
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result + num);
 * };
 * return Aigle.reduce(collection, iterator, '')
 *   .then(value => console.log(value)); // '142'
 */
function reduce(collection, iterator, result) {
  return new Reduce(collection, iterator, result)._execute();
}
