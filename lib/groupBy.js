'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class GroupByArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = {};
  }

  _callResolve(key, index) {
    if (this._result[key]) {
      this._result[key].push(this._array[index]);
    } else {
      this._result[key] = [this._array[index]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class GroupByObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = {};
  }

  _callResolve(key, index) {
    if (this._result[key]) {
      this._result[key].push(this._object[this._keys[index]]);
    } else {
      this._result[key] = [this._object[this._keys[index]]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

module.exports = groupBy;

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
 * Aigle.groupBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1] };
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
 * Aigle.groupBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1] };
 *     console.log(order); // [1, 2, 4];
 *   });
 */
function groupBy(collection, iterator) {
  if (Array.isArray(collection)) {
    return new GroupByArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new GroupByObject(collection, iterator)._execute();
  }
  return Aigle.resolve({});
}
