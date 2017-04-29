'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');
const { INTERNAL, PENDING, compactArray } = require('./internal/util');

class RejectSeries extends EachSeries {

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

module.exports = { rejectSeries, RejectSeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[index];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[this._keys[index]];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
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
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.rejectSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.rejectSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function rejectSeries(collection, iterator) {
  return new RejectSeries(iterator, collection)._execute();
}
