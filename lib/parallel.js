'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayEachWithFunc,
  promiseObjectEachWithFunc,
  promiseMapEachWithFunc,
  promiseSetEachWithFunc,
  iteratorSymbol
} = require('./internal/util');
const { callResolve, callResolveMap } = require('./props');

class Parallel extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = undefined;
    this._result = undefined;
    if (coll === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(coll);
    }
  }

  _set(coll) {
    if (Array.isArray(coll)) {
      const size = coll.length;
      this._rest = size;
      this._result = Array(size);
      this._callResolve = callResolve;
      promiseArrayEachWithFunc(this, size, coll);
    } else if (!coll || typeof coll !== 'object') {
      this._rest = 0;
      this._result = {};
    } else if (coll[iteratorSymbol]) {
      const size = coll.size;
      this._rest = size;
      if (coll instanceof Map) {
        const result = new Map();
        this._result = result;
        this._callResolve = callResolveMap;
        promiseMapEachWithFunc(this, Infinity, coll, result);
      } else {
        this._result = Array(this._rest);
        this._callResolve = callResolve;
        promiseSetEachWithFunc(this, Infinity, coll);
      }
    } else {
      const result = {};
      const keys = Object.keys(coll);
      const size = keys.length;
      this._rest = size;
      this._result = result;
      this._callResolve = callResolve;
      promiseObjectEachWithFunc(this, size, coll, result, keys);
    }
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    }
    return this;
  }

  _execute() {
    return this._promise;
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { parallel, Parallel };

/**
 * `Aigle.parallel` functionality is similar to [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all)
 * and [`Aigle.props`](https://suguru03.github.io/aigle/docs/global.html#props), and the function allows function collection.
 * @param {Array|Object} collection - it should be an array/object of functions or Promise instances
 * @example
 *   Aigle.parallel([
 *     () => Aigle.delay(30, 1),
 *     Aigle.delay(20, 2),
 *     3
 *   ]).then(array => {
 *     console.log(array); // [1, 2, 3]
 *   });
 *
 * @example
 *   Aigle.parallel({
 *     a: () => Aigle.delay(30, 1),
 *     b: Aigle.delay(20, 2),
 *     c: 3
 *   }).then(obj => {
 *     console.log(obj); // { a: 1, b: 2, c: 3 }
 *   });
 */
function parallel(collection) {
  return new Parallel(collection)._promise;
}
