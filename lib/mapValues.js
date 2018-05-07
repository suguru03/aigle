'use strict';

const { Each } = require('./each');
const { setShorthandWithOrder } = require('./internal/collection');

class MapValues extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { mapValues, MapValues };

function set(collection) {
  setShorthandWithOrder.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  this._result[this._keys[index]] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.mapValues` is similar to [`Aigle.map`](https://suguru03.github.io/aigle/docs/global.html#map).
 * It returns an object instead of an array.
 * @param {Array|Object} collection
 * @param {Function|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValues(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 2, '1': 8, '2': 4 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValues(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 2, b: 8, c: 4 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const collection = {
 *   task1: { uid: 1, name: 'test1' },
 *   task2: { uid: 4, name: 'test4' },
 *   task3: { uid: 2, name: 'test2' }
 * }];
 * Aigle.mapValues(collection, 'uid')
 *   .then(uids => console.log(uids)); // { task1: 1, task2: 4, task3: 2 }
 */
function mapValues(collection, iterator) {
  return new MapValues(collection, iterator)._execute();
}
