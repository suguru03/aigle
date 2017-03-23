'use strict';

const timesLimit = require('./timesLimit');

module.exports = timesSeries;

/**
 * @param {integer} times
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const timer = [30, 20, 10];
 * const iterator = n => {
 *   return Aigle.delay(timer[n])
 *     .then(() => {
 *       order.push(n);
 *       return n;
 *     });
 * };
 * Aigle.timesSeries(3, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [0, 1, 2]
 *   });
 */
function timesSeries(times, iterator) {
  return timesLimit(times, 1, iterator);
}
