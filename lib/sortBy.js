'use strict';

const { Aigle } = require('./aigle');
const { sort } = require('./internal/util');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

module.exports = sortBy;

class SortByArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
  }
}

class SortByObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
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
 */
function sortBy(collection, iterator) {
  if (Array.isArray(collection)) {
    return new SortByArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new SortByObject(collection, iterator)._execute();
  }
  return Aigle.resolve([]);
}
