'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, INTERNAL, compactArray } = require('./internal/util');
const { AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

module.exports = filterLimit;

class FilterLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._promise._resolved === 0 && this._index < this._size) {
      this._next();
    }
  }
}
class FilterLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._promise._resolved === 0 && this._index < this._size) {
      this._next();
    }
  }
}

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
 *       return num % 2;
 *     });
 * };
 * Aigle.filterLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 5, 3];
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
 *       return num % 2;
 *     });
 * };
 * Aigle.filterLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 5, 3];
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
 *       return num % 2;
 *     });
 * };
 * Aigle.filterLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 5, 3];
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function filterLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new FilterLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FilterLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}
