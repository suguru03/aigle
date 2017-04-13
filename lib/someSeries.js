'use strict';

const { Aigle } = require('./aigle');
const { AigleSeriesArray, AigleSeriesObject } = require('./internal/aigleSeries');
const { map } = require('./internal/util');

module.exports = someSeries;

const [SomeSeriesArray, SomeSeriesObject] = map([AigleSeriesArray, AigleSeriesObject], Class => {

  return class extends Class {

    constructor(collection, iterator) {
      super(collection, iterator);
      this._result = false;
    }

    _callResolve(value) {
      if (value) {
        this._promise._resolve(true);
      } else if (--this._rest === 0) {
        this._promise._resolve(false);
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
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someSeries(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someSeries(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return false;
 *     });
 * };
 * Aigle.someSeries(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // false
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function someSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new SomeSeriesArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new SomeSeriesObject(collection, iterator)._execute();
  }
  return Aigle.resolve(false);
}
