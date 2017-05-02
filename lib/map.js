'use strict';

const { Each } = require('./each');
const { PENDING } = require('./internal/util');
const { setShorthand } = require('./internal/collection');

class Map extends Each {

  constructor(iterator, collection) {
    super(iterator, collection);
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

module.exports = { map, Map };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  return this;
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
 *       return num * 2;
 *     });
 * };
 * Aigle.map(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 2, 4];
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
 * Aigle.map(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const collection = [{
 *  uid: 1, name: 'test1'
 * }, {
 *  uid: 4, name: 'test4'
 * }, {
 *  uid: 2, name: 'test2'
 * }];
 * Aigle.map(collection, 'uid')
 *   .then(uids => console.log(uids)); // [1, 4, 2]
 */
function map(collection, iterator) {
  return new Map(iterator, collection)._execute();
}
