'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');
const { call3, callProxyReciever, clone } = require('./internal/util');

class TransformSeries extends EachSeries {
  constructor(collection, iterator, accumulator) {
    super(collection, iterator, set);
    if (accumulator !== undefined) {
      this._result = accumulator;
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }
}

module.exports = { transformSeries, TransformSeries };

function set(collection) {
  setSeries.call(this, collection);
  if (this._keys !== undefined || this._coll === undefined) {
    if (this._result === undefined) {
      this._result = {};
    }
    this._iterate = iterateObject;
  } else {
    if (this._result === undefined) {
      this._result = [];
    }
    this._iterate = iterateArray;
  }
  return this;
}

function iterateArray() {
  const index = this._index++;
  callProxyReciever(call3(this._iterator, this._result, this._coll[index], index), this, index);
}

function iterateObject() {
  const index = this._index++;
  const key = this._keys[index];
  callProxyReciever(call3(this._iterator, this._result, this._coll[key], key), this, index);
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result[index] = num;
 *     });
 * };
 * Aigle.transformSeries(collection, iterator, {})
 *   .then(object => {
 *     console.log(object); // { '0': 1, '1': 4, '2': 2 }
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *     });
 * };
 * Aigle.transformSeries(collection, iterator, {})
 *   .then(array => {
 *     console.log(array); // [1, 4, 2]
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *       return num !== 4;
 *     });
 * };
 * Aigle.transformSeries(collection, iterator, [])
 *   .then(array => {
 *     console.log(array); // [1, 4]
 *     console.log(order); // [1, 4]
 *   });
 */
function transformSeries(collection, iterator, accumulator) {
  return new TransformSeries(collection, iterator, accumulator)._execute();
}
