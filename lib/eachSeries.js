'use strict';

const { AigleProxy } = require('aigle-core');

const { Aigle } = require('./aigle');
const {
  INTERNAL,
  PENDING,
  call2,
  callProxyReciever
} = require('./internal/util');

class EachSeires extends AigleProxy {

  constructor(iterator, collection) {
    super();
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._result = undefined;
    if (collection === PENDING) {
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, collection);
    }
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
    return this._promise;
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

module.exports = { set, eachSeries, EachSeires };

function set(collection) {
  if (Array.isArray(collection)) {
    const size = collection.length;
    this._coll = collection;
    this._rest = size;
    this._size = size;
    this._keys = undefined;
    this._iterate = iterateArray;
  } else if (collection && typeof collection === 'object') {
    const keys = Object.keys(collection);
    const size = keys.length;
    this._coll = collection;
    this._rest = size;
    this._size = size;
    this._keys = keys;
    this._iterate = iterateObject;
  } else {
    this._rest = 0;
  }
  return this;
}

function iterateArray() {
  const i = this._index++;
  callProxyReciever(call2(this._iterator, this._coll[i], i), this, i);
}

function iterateObject() {
  const i = this._index++;
  const key = this._keys[i];
  callProxyReciever(call2(this._iterator, this._coll[key], key), this, i);
}

function execute(collection) {
  this._callResolve = this._iterate;
  this._set(collection);
  this._execute();
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => order.push(num));
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => order.push(num));
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num !== 4; // break
 *     });
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4];
 *   });
 */
function eachSeries(collection, iterator) {
  return new EachSeires(iterator, collection)._execute();
}
