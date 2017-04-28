'use strict';

const { EachLimit } = require('./eachLimit');
const { PENDING } = require('./internal/util');
const { setLimit } = require('./internal/collection');

class FindLimit extends EachLimit {

  constructor(limit, iterator, collection) {
    super(limit, iterator, collection);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }
}

module.exports = { findLimit, FindLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._callRest = 0;
    this._promise._resolve(this._coll[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._callRest = 0;
    this._promise._resolve(this._coll[this._keys[index]]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else if (this._callRest-- > 0) {
    this._iterate();
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
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 3, 5, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 3, 5, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 2];
 *   });
 */
function findLimit(collection, limit, iterator) {
  return new FindLimit(limit, iterator, collection)._execute();
}
