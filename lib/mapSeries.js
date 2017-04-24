'use strict';

const { PENDING } = require('./internal/util');
const {
  set,
  EachSeires
} = require('./eachSeries');

class MapSeries extends EachSeires {

  constructor(iterator, collection) {
    super(iterator, collection);
    if (collection === PENDING) {
      this._set = _set;
    } else {
      this._result = Array(this._rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }
}

module.exports = { mapSeries, MapSeries };

function _set(collection) {
  set.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
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
 * Aigle.mapSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 4, 2];
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
 * Aigle.mapSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function mapSeries(collection, iterator) {
  return new MapSeries(iterator, collection)._execute();
}
