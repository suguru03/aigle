'use strict';

const someLimit = require('./someLimit');

module.exports = someSeries;

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
  return someLimit(collection, 1, iterator);
}
