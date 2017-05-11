'use strict';

const { EachSeries } = require('./eachSeries.js');

class EverySeries extends EachSeries {

  constructor(collection, iterator) {
    super(collection, iterator);
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
}

module.exports = { everySeries, EverySeries };

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
  return new EverySeries(collection, iterator)._execute();
}
