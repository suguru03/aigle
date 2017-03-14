'use strict';

const concatLimit = require('./concatLimit');

module.exports = concatSeries;

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
  return concatLimit(collection, 1, iterator);
}
