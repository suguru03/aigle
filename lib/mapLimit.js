'use strict';

const { EachLimit } = require('./eachLimit');
const { PENDING } = require('./internal/util');
const { setLimit } = require('./internal/collection');

class MapLimit extends EachLimit {

  constructor(limit, iterator, collection) {
    super(limit, iterator, collection);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { mapLimit, MapLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  return this;
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
 *       return num * 2;
 *     });
 * };
 * Aigle.mapLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 10, 6, 8, 4];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 10, 6, 8, 4];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 10, 6, 8, 4];
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function mapLimit(collection, limit, iterator) {
  return new MapLimit(limit, iterator, collection)._execute();
}

