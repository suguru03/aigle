'use strict';

const { Aigle } = require('./aigle');
const { AigleSeriesArray, AigleSeriesObject } = require('./internal/aigleSeries');
const { INTERNAL, compactArray } = require('./internal/util');

module.exports = filterSeries;

class FilterSeriesArray extends AigleSeriesArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else {
      this._iterate();
    }
  }
}

class FilterSeriesObject extends AigleSeriesObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else {
      this._iterate();
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
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filterSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
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
 * Aigle.filterSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function filterSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FilterSeriesArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new FilterSeriesObject(collection, iterator)._execute();
  }
  return Aigle.resolve([]);
}
