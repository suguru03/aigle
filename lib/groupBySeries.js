'use strict';

const groupByLimit = require('./groupByLimit');

module.exports = groupBySeries;

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
 * Aigle.groupBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [4, 2], '1': [1] };
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
 * Aigle.groupBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [4, 2], '1': [1] };
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function groupBySeries(collection, iterator) {
  return groupByLimit(collection, 1, iterator);
}
