'use strict';

const { Aigle } = require('./aigle');
const { AigleSeriesArray, AigleSeriesObject } = require('./internal/aigleSeries');

module.exports = omitSeries;

class OmitSeriesArray extends AigleSeriesArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (!value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }
}

class OmitSeriesObject extends AigleSeriesObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (!value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
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
 *       return num % 2;
 *     });
 * };
 * Aigle.omitSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '1': 4, '2': 2 }
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
 *       return num % 2;
 *     });
 * };
 * Aigle.omitSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { b: 4, c: 2 }
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function omitSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new OmitSeriesArray(collection, iterator)._execute();
  }
  if (collection && typeof collection === 'object') {
    return new OmitSeriesObject(collection, iterator)._execute();
  }
  return Aigle.resolve({});
}
