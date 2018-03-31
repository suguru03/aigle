'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class PickBySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { pickBySeries, PickBySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.pickBySeries` is almost the as [`Aigle.pickBy`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBy), but it will work in series.
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
 *       return num % 2;
 *     });
 * };
 * Aigle.pickBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1 }
 *     console.log(order); // [1, 4, 2]
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
 * Aigle.pickBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function pickBySeries(collection, iterator) {
  return new PickBySeries(collection, iterator)._execute();
}
