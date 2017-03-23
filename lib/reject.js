'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class RejectArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

class RejectObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

module.exports = reject;

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.reject(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.reject(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 2, 4];
 *   });
 */
function reject(collection, iterator) {
  if (Array.isArray(collection)) {
    return new RejectArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new RejectObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}
