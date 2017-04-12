'use strict';

const { Aigle } = require('./aigle');
const { AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');
const { DEFAULT_LIMIT, map } = require('./internal/util');

module.exports = someLimit;

const [SomeLimitArray, SomeLimitObject] = map([AigleLimitArray, AigleLimitObject], Class => {

  return class extends Class {

    constructor(array, iterator, limit) {
      super(array, iterator, limit);
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
      } else if (this._index < this._size) {
        this._next();
      }
    }
  };
});

/**
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someLimit(collection, 2, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 3, 5, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someLimit(collection, 2, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 3, 5, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someLimit(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 2]
 *   });
 */
function someLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new SomeLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SomeLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve(false);
}
