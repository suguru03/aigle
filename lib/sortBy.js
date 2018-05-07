'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');
const { sortArray, sortObject } = require('./internal/util');

class SortBy extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { sortBy, SortBy };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortArray(this._coll, this._result));
  }
}

function callResolveObject(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortObject(this._coll, this._keys, this._result));
  }
}

/**
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * It creates a sorted array which is ordered by results of iterator.
 * @param {Array|Object} collection
 * @param {Function|string} iterator
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
 * Aigle.sortBy(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 2, 4]
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
 * Aigle.sortBy(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   uid: 2, name: 'bargey', uid: 2
 * }, {
 *   uid: 1, name: 'fread'
 * }];
 * Aigle.sortBy(collection, 'uid')
 *   .then(array => {
 *     console.log(array); // [{ uid: 1, name: 'fread' }, { uid: 2, name: 'bargey' ]
 *   });
 */
function sortBy(collection, iterator) {
  return new SortBy(collection, iterator)._execute();
}
