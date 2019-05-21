'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayIterator,
  promiseObjectIterator,
  promiseSetIterator,
  promiseMapIterator,
  iteratorSymbol
} = require('./internal/util');
const { execute } = require('./internal/collection');

class Series extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._index = -1;
    this._coll = undefined;
    this._keys = undefined;
    this._rest = undefined;
    this._result = undefined;
    this._iterate = undefined;
    if (coll === PENDING) {
      this._set = set;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, coll);
    }
  }

  _execute() {
    this._iterate();
    return this._promise;
  }

  _callResolve(value, key) {
    this._result[key] = value;
    this._iterate();
  }

  _callResolveMap(value, key) {
    this._result.set(key, value);
    this._iterate();
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { series, Series };

function set(coll) {
  this._coll = coll;
  this._iterate = iterate;
  if (Array.isArray(coll)) {
    const size = coll.length;
    this._rest = size;
    this._result = Array(size);
    this._iterator = promiseArrayIterator;
  } else if (typeof coll !== 'object' || coll === null) {
    this._rest = 0;
    this._result = {};
  } else if (coll[iteratorSymbol]) {
    this._coll = coll[iteratorSymbol]();
    const size = coll.size;
    this._rest = size;
    if (coll instanceof Map) {
      const result = new Map();
      this._result = result;
      this._callResolve = this._callResolveMap;
      this._iterator = promiseMapIterator;
    } else {
      this._result = [];
      this._iterator = promiseSetIterator;
    }
  } else {
    const result = {};
    const keys = Object.keys(coll);
    this._rest = keys.length;
    this._keys = keys;
    this._result = result;
    this._iterator = promiseObjectIterator;
  }
  return this;
}

function iterate() {
  if (++this._index === this._rest) {
    this._promise._resolve(this._result);
  } else {
    this._iterator(this, this._coll, this._index, this._result, this._keys);
  }
}

/**
 * `Aigle.series` functionality has the same functionality as [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel)
 * and it works in series.
 * @param {Array|Object} collection - it should be an array/object of functions or Promise instances
 * @example
 *   Aigle.series([
 *     () => Aigle.delay(30, 1),
 *     Aigle.delay(20, 2),
 *     3
 *   ]).then(array => {
 *     console.log(array); // [1, 2, 3]
 *   });
 *
 * @example
 *   Aigle.series({
 *     a: () => Aigle.delay(30, 1),
 *     b: Aigle.delay(20, 2),
 *     c: 3
 *   }).then(obj => {
 *     console.log(obj); // { a: 1, b: 2, c: 3 }
 *   });
 */
function series(collection) {
  return new Series(collection)._execute();
}
