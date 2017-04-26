'use strict';

const { EachLimit } = require('./eachLimit');

class ConcatLimit extends EachLimit {

  constructor(limit, iterator, collection) {
    super(limit, iterator, collection);
    this._result = [];
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { concatLimit, ConcatLimit };


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
 *       return num;
 *     });
 * };
 * Aigle.concatLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 3, 5, 2, 4];
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
 *       return num;
 *     });
 * };
 * Aigle.concatLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 3, 5, 2, 4];
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
 *       return num;
 *     });
 * };
 * Aigle.concatLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5];
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function concatLimit(collection, limit, iterator) {
  return new ConcatLimit(limit, iterator, collection)._execute();
}
