'use strict';

const transformLimit = require('./transformLimit');

module.exports = transformSeries;

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result[index] = num);
 * };
 * return Aigle.transformSeries(collection, iterator, {})
 *   .then(value => console.log(value)); // { '0': 1, '1': 4, '2': 2 }
 *
 * @example
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result.push(num));
 * };
 * return Aigle.transformSeries(collection, iterator)
 *   .then(value => console.log(value)); // [1, 4, 2]
 *
 * @example
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       result.push(num);
 *       return num !== 4;
 *     });
 * };
 * return Aigle.transformSeries(collection, iterator, [])
 *   .then(value => console.log(value)); // [1, 4]
 */
function transformSeries(collection, iterator, accumulator) {
  return transformLimit(collection, 1, iterator, accumulator);
}
