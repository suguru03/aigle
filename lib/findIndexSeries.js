'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class FindIndexSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = -1;
  }
  _callResolve(value, index) {
    if (value) {
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    } else {
      this._iterate();
    }
  }
}

module.exports = { findIndexSeries, FindIndexSeries };

function set(collection) {
  setSeries.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * `Aigle.findIndexSeries` is almost the as [`Aigle.findIndex`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndex), but it will work in series.
 * @param {Array} collection
 * @param {Function} iterator
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
 * Aigle.findIndexSeries(collection, iterator)
 *   .then(index => {
 *     console.log(index); // 1
 *     console.log(order); // [1, 4];
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
 * Aigle.findIndexSeries(collection, iterator)
 *   .then(index => {
 *     console.log(index); // -1
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function findIndexSeries(collection, iterator) {
  return new FindIndexSeries(collection, iterator)._execute();
}
