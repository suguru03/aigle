'use strict';

const { Aigle } = require('./aigle');
const { AigleSeriesArray, AigleSeriesObject } = require('./internal/aigleSeries');

module.exports = mapSeries;

class MapSeriesArray extends AigleSeriesArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
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

class MapSeriesObject extends AigleSeriesObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
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
  if (Array.isArray(collection)) {
    return new MapSeriesArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new MapSeriesObject(collection, iterator)._execute();
  }
  return Aigle.resolve([]);
}
