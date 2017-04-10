'use strict';

const { Aigle } = require('./aigle');
const { AigleSeriesArray, AigleSeriesObject } = require('./internal/aigleSeries');

module.exports = eachSeries;

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => order.push(num));
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => order.push(num));
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
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
 *       return num !== 4; // break
 *     });
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4];
 *   });
 */
function eachSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new AigleSeriesArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new AigleSeriesObject(collection, iterator)._execute();
  }
  return Aigle.resolve();
}

