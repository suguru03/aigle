'use strict';

const { Aigle } = require('./aigle');
const { map } = require('./internal/util');
const { AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

module.exports = everyLimit;

const [EveryLimitArray, EveryLimitObject] = map([AigleLimitArray, AigleLimitObject], Class => {

  return class extends Class {

    constructor(array, iterator, limit) {
      super(array, iterator, limit);
      this._result = true;
    }

    _callResolve(value) {
      if (!value) {
        this._callRest = 0;
        this._promise._resolve(false);
      } else if (--this._rest === 0) {
        this._promise._resolve(true);
      } else if (this._callRest-- > 0) {
        this._iterate();
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
 *       return true;
 *     });
 * };
 * Aigle.everyLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = {
 *   task1: 1,
 *   task2: 5,
 *   task3: 3,
 *   task4: 4,
 *   task5: 2
 * };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.everyLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num === 4;
 *     });
 * };
 * Aigle.everyLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // false
 *     console.log(order); // [1, 2, 3, 4];
 *   });
 */
function everyLimit(collection, limit, iterator) {
  if (Array.isArray(collection)) {
    return new EveryLimitArray(collection, iterator, limit)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new EveryLimitObject(collection, iterator, limit)._execute();
  }
  return Aigle.resolve(true);
}
