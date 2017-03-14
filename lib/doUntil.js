'use strict';

const { DoWhilst } = require('./doWhilst');
const { UntilTester } = require('./until');

module.exports = doUntil;

/**
 * @param {*} [value]
 * @param {Function} iterator
 * @param {Function} tester
 * @return {Aigle} Returns an Aigle instance
 * @example
 * let count = 0;
 * const order = [];
 * const tester = num => {
 *   order.push(`t:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num === 4);
 * };
 * const iterator = () => {
 *   const num = ++count;
 *   order.push(`i:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num);
 * };
 * Aigle.doUntil(iterator, tester)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(count); // 4
 *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
 *   });
 *
 * @example
 * const order = [];
 * const tester = num => {
 *   order.push(`t:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num === 4);
 * };
 * const iterator = count => {
 *   const num = ++count;
 *   order.push(`i:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num);
 * };
 * Aigle.doUntil(0, iterator, tester)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
 *   });
 */
function doUntil(value, iterator, tester) {
  if (typeof tester !== 'function') {
    tester = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoWhilst(new UntilTester(tester), iterator)._iterate(value);
}
