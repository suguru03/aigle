'use strict';

const { Each } = require('./each');
const { PENDING } = require('./internal/util');
const { setShorthand } = require('./internal/collection');

class Find extends Each {

  constructor(iterator, collection) {
    super(iterator, collection);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }
}

module.exports = { find, Find };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._promise._resolve(this._coll[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._promise._resolve(this._coll[this._keys[index]]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

/**
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
  return new Find(iterator, collection)._execute();
}
