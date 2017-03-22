'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class GroupByLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = {};
  }

  _callResolve(key, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (this._result[key]) {
      this._result[key].push(this._array[index]);
    } else {
      this._result[key] = [this._array[index]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class GroupByLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = {};
  }

  _callResolve(key, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (this._result[key]) {
      this._result[key].push(this._object[this._keys[index]]);
    } else {
      this._result[key] = [this._object[this._keys[index]]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = groupByLimit;

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
 * Aigle.groupByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
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
 * Aigle.groupByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
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
 * Aigle.groupByLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function groupByLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new GroupByLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new GroupByLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve({});
}
