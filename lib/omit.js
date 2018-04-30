'use strict';

const { Each } = require('./each');
const { setOmitShorthand } = require('./internal/collection');

class Omit extends Each {
  constructor(collection, iterator, args) {
    if (typeof iterator !== 'function') {
      iterator = [iterator, ...args];
    }
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { omit, Omit };

function set(collection) {
  setOmitShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (!value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  if (!value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.omit` has almost the same functionality as [`Aigle.filter`](https://suguru03.github.io/aigle/docs/global.html#filter).
 * It will return an object as a result.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @param {*} [args]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1 }
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
 * Aigle.omit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 */
function omit(collection, iterator, ...args) {
  return new Omit(collection, iterator, args)._execute();
}
