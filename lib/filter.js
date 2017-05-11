'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');
const { INTERNAL, PENDING, compactArray } = require('./internal/util');

class Filter extends Each {

  constructor(collection, iterator) {
    super(collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }
}

Filter.prototype._set = set;

module.exports = { filter, Filter };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? this._coll[index] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? this._coll[this._keys[index]] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
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
 * Aigle.filter(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
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
 * Aigle.filter(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.filter(collection, 'active')
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: true }]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.filter(collection, ['name', 'fread'])
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: true }]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.filter(collection, { name: 'fread', active: true })
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: true }]
 *   });
 */
function filter(collection, iterator) {
  return new Filter(collection, iterator)._execute();
}
