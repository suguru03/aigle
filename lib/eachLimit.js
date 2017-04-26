'use strict';

const { AigleProxy } = require('aigle-core');

const { Aigle } = require('./aigle');
const {
  DEFAULT_LIMIT,
  INTERNAL,
  PENDING,
  call2,
  callProxyReciever
} = require('./internal/util');

class EachLimit extends AigleProxy {

  constructor(limit, iterator, collection) {
    super();
    if (typeof limit === 'function') {
      iterator = limit;
      limit = DEFAULT_LIMIT;
    }
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._limit = limit;
    this._coll = undefined;
    this._rest = undefined;
    this._size = undefined;
    this._keys = undefined;
    this._result = undefined;
    this._iterate = undefined;
    this._callRest = undefined;
    if (collection === PENDING) {
      this._set = set;
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
      while (this._limit--) {
        this._iterate();
      }
    }
    return this._promise;
  }

  _callResolve(value) {
    if (value === false) {
      this._callRest = 0;
      this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  }
}

module.exports = { set, eachLimit, EachLimit };

function set(collection) {
  if (Array.isArray(collection)) {
    this._coll = collection;
    this._size = collection.length;
    this._keys = undefined;
    this._iterate = iterateArray;
  } else if (collection && typeof collection === 'object') {
    const keys = Object.keys(collection);
    this._coll = collection;
    this._size = keys.length;
    this._keys = keys;
    this._iterate = iterateObject;
  } else {
    this._size = 0;
    this._rest = 0;
  }
  const { _limit, _size } = this;
  this._rest = _size;
  this._limit = _limit < _size ? _limit : _size;
  this._callRest = _size - this._limit;
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


module.exports = { eachLimit, EachLimit };

/**
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.eachLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = {
 *   task1: 1,
 *   task2: 5,
 *   task3: 3,
 *   task4: 4,
 *   task5: 2
 * };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.eachLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.eachLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num !== 3;
 *     });
 * };
 * Aigle.eachLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 3];
 *   });
 */
function eachLimit(collection, limit, iterator) {
  return new EachLimit(limit, iterator, collection)._execute();
}

