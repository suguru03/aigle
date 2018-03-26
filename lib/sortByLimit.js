'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');
const { sortArray, sortObject } = require('./internal/util');

class SortByLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }
}

module.exports = { sortByLimit, SortByLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortArray(this._coll, this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortObject(this._coll, this._keys, this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.sortByLimit` is almost the smae as [`Aigle.sortBy`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBy) and
 * [`Aigle.sortBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBySeries), but it will work with concurrency.
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
 * Aigle.sortByLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5]
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortByLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5]
 *     console.log(order); // [1, 3, 5, 2, 4]
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
 * Aigle.sortByLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5]
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function sortByLimit(collection, limit, iterator) {
  return new SortByLimit(collection, limit, iterator)._execute();
}
