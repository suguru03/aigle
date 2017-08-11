'use strict';

const { EachSeries } = require('./eachSeries');
const { sort } = require('./internal/util');
const { setSeries } = require('./internal/collection');

class SortBySeries extends EachSeries {

  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { sortBySeries, SortBySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criteria, index) {
  this._result[index] = { criteria, value: this._coll[index] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
  } else {
    this._iterate();
  }
}

function callResolveObject(criteria, index) {
  this._result[index] = { criteria, value: this._coll[this._keys[index]] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.sortBySeries` is almost the smae as [`Aigle.sortBy`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBy), but it will work in series.
 *
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortBySeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortBySeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function sortBySeries(collection, iterator) {
  return new SortBySeries(collection, iterator)._execute();
}
