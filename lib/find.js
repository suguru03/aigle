'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class FindArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }
}

class FindObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }
}

module.exports = find;

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
 * Aigle.find(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 2
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
 * Aigle.find(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 2
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
 * Aigle.find(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 4]
 *   });
 */
function find(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FindArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FindObject(collection, iterator)._iterate();
  }
  return Aigle.resolve();
}
