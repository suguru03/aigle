'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');
const { map } = require('./internal/util');

module.exports = some;

const [SomeArray, SomeObject] = map([AigleEachArray, AigleEachObject], Class => {

  return class extends Class {

    constructor(collection, iterator) {
      super(collection, iterator);
      this._result = false;
    }

    _callResolve(value) {
      if (this._promise._resolved !== 0) {
        return;
      }
      if (value) {
        this._promise._resolve(true);
      } else if (--this._rest === 0) {
        this._promise._resolve(false);
      }
    }
  };
});

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
 * Aigle.some(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 2]
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
 * Aigle.some(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 2]
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
 * Aigle.some(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // false
 *     console.log(order); // [1, 2, 4]
 *   });
 */
function some(collection, iterator) {
  if (Array.isArray(collection)) {
    return new SomeArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new SomeObject(collection, iterator)._execute();
  }
  return Aigle.resolve(false);
}
