'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class FindIndex extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = -1;
  }

  _callResolve(value, index) {
    if (value) {
      this._size = 0;
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    }
  }
}

module.exports = { findIndex, FindIndex };

function set(collection) {
  setShorthand.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * `Aigle.findIndex` is like `Aigle.find`, it will return the index of the first element which the iterator returns truthy.
 * @param {Array} collection
 * @param {Function|Array|Object|string} iterator
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
 * Aigle.findIndex(collection, iterator)
 *   .then(index => {
 *     console.log(index); // 2
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
 * Aigle.findIndex(collection, iterator)
 *   .then(index => {
 *     console.log(index); // -1
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.findIndex(collection, 'active')
 *   .then(index => {
 *     console.log(index); // 1
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.findIndex(collection, ['name', 'fread'])
 *   .then(index => {
 *     console.log(index); // true
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.find(collection, { name: 'fread', active: true })
 *   .then(index => {
 *     console.log(index); // 1
 *   });
 */
function findIndex(collection, iterator) {
  return new FindIndex(collection, iterator)._execute();
}
