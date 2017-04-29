'use strict';

const { EachSeries } = require('./eachSeries');
const { PENDING, sort } = require('./internal/util');
const { setSeries } = require('./internal/collection');

class SortBySeries extends EachSeries {

  constructor(iterator, collection) {
    super(iterator, collection);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
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
  return new SortBySeries(iterator, collection)._execute();
}
