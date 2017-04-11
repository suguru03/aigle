'use strict';

const { Aigle } = require('./aigle');
const { AigleSeriesArray, AigleSeriesObject } = require('./internal/aigleSeries');
const { map } = require('./internal/util');

module.exports = everySeries;

const [EverySeriesArray, EverySeriesObject] = map([AigleSeriesArray, AigleSeriesObject], Class => {

  return class extends Class {

    constructor(array, iterator) {
      super(array, iterator);
      this._result = true;
    }

    _callResolve(value) {
      if (!value) {
        this._promise._resolve(false);
      } else if (--this._rest === 0) {
        this._promise._resolve(true);
      } else {
        this._iterate();
      }
    }
  };
});

module.exports = everySeries;

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
 *       return true;
 *     });
 * };
 * Aigle.everySeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.everySeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
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
 *       return n % 2;
 *     });
 * };
 * Aigle.everySeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // false
 *     console.log(order); // [1, 4];
 *   });
 */
function everySeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new EverySeriesArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new EverySeriesObject(collection, iterator)._execute();
  }
  return Aigle.resolve(true);
}
