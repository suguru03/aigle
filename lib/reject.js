'use strict';

const { Each } = require('./each');
const { setParallel } = require('./internal/collection');
const { INTERNAL, PENDING, compactArray } = require('./internal/util');

class Reject extends Each {

  constructor(iterator, collection) {
    super(iterator, collection);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }
}

module.exports = { reject, Reject };

function set(collection) {
  setParallel.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[index];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[this._keys[index]];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

/**
 * Aigle reject has two features.
 * One of them is basic [`Promise.reject`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject) function, it returns a rejected Aigle instance.
 * The other is a collection function, it requires an iterator function. It is the opposite of [`filter`](https://suguru03.github.io/aigle/docs/Aigle.html#filter).
 * If the iterator function is not defined, the function works as a first one.
 *
 * @param {Function|Array|Object} collection
 * @param {Function} [iterator]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const error = new Error('error');
 * Aigle.reject(error)
 *   .catch(error => {
 *     console.log(error); // error
 *   });
 *
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
  return new Reject(iterator, collection)._execute();
}
