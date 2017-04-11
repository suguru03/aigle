'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');
const { map: _map } = require('./internal/util');

const [MapArray, MapObject] = _map([AigleEachArray, AigleEachObject], Class => {

  return class extends Class {

    constructor(array, iterator) {
      super(array, iterator);
      this._result = Array(this._rest);
    }

    _callResolve(value, index) {
      this._result[index] = value;
      if (--this._rest === 0) {
        this._promise._resolve(this._result);
      }
    }
  };
});

module.exports = map;

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
 * Aigle.map(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 2, 4];
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
 * Aigle.map(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 */
function map(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}
