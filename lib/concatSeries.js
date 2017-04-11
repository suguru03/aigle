'use strict';

const { Aigle } = require('./aigle');
const { AigleSeriesArray, AigleSeriesObject } = require('./internal/aigleSeries');
const { map } = require('./internal/util');

module.exports = concatSeries;

const [ConcatSeriesArray, ConcatSeriesObject] = map([AigleSeriesArray, AigleSeriesObject], Class => {

  return class extends Class {

    constructor(array, iterator) {
      super(array, iterator);
      this._result = [];
    }

    _callResolve(value) {
      if (Array.isArray(value)) {
        this._result.push(...value);
      } else {
        this._result.push(value);
      }
      if (--this._rest === 0) {
        this._promise._resolve(this._result);
      } else {
        this._iterate();
      }
    }
  };
});


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
 *       return num;
 *     });
 * };
 * Aigle.concatSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 4, 2];
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
 *       return num;
 *     });
 * };
 * Aigle.concatSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 4, 2];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function concatSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new ConcatSeriesArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new ConcatSeriesObject(collection, iterator)._execute();
  }
  return Aigle.resolve([]);
}
