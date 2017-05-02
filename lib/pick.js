'use strict';

const { Each } = require('./each');
const { PENDING } = require('./internal/util');
const { setParallel } = require('./internal/collection');

class Pick extends Each {

  constructor(iterator, collection) {
    super(iterator, collection);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }
}

module.exports = { pick, Pick };

function set(collection) {
  setParallel.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  if (value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
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
 *       return num % 2;
 *     });
 * };
 * Aigle.pick(collection, iterator)
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
 * Aigle.pick(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 */
function pick(collection, iterator) {
  return new Pick(iterator, collection)._execute();
}
