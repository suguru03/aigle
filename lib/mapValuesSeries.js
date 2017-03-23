'use strict';

const { Aigle } = require('./aigle');
const { MapValuesLimitArray, MapValuesLimitObject } = require('./mapValuesLimit');

module.exports = mapValuesSeries;

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
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValuesSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 2, '1': 8, '2': 4 };
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
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValuesSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 2, b: 8, c: 4 }
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function mapValuesSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapValuesLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapValuesLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve({});
}
