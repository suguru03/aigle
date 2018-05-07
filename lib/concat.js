'use strict';

const { Each } = require('./each');
const { concatArray } = require('./internal/util');
const { setParallel } = require('./internal/collection');

class Concat extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(concatArray(this._result));
    }
  }
}

module.exports = { concat, Concat };

function set(collection) {
  setParallel.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
 * `Aigle.concat` has almost the same functionality as `Array#concat`.
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * The `iterator` needs to return a promise or something.
 * If a promise is returned, the function will wait until the promise is fulfilled.
 * Then the result will be assigned to an array, the role is the same as `Array#concat`.
 * All of them are finished, the function will return an array as a result.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concat(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concat(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 */
function concat(collection, iterator) {
  return new Concat(collection, iterator)._execute();
}
