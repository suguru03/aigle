'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class FindIndexLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
    this._result = -1;
  }

  _callResolve(value, index) {
    if (value) {
      this._callRest = 0;
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { findIndexLimit, FindIndexLimit };

function set(collection) {
  setLimit.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * `Aigle.findIndexLimit` is almost the as [`Aigle.findIndex`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndex) and
 * [`Aigle.findIndexSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndexSeries), but it will work with concurrency.
 * @param {Array} collection
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
 * Aigle.findIndexLimit(collection, 2, iterator)
 *   .then(index => {
 *     console.log(index); // 4
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
 * Aigle.findIndexLimit(collection, iterator)
 *   .then(index => {
 *     console.log(index); // 4
 *     console.log(order); // [1, 2];
 *   });
 */
function findIndexLimit(collection, limit, iterator) {
  return new FindIndexLimit(collection, limit, iterator)._execute();
}
