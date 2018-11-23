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
      this._result = undefined;
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
 * `Aigle.parallel` functionality is [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all) plus [`Aigle.props`](https://suguru03.github.io/aigle/docs/global.html#props).
 * The function allows an object or an array as the first argument.
 * @param {Array|Object} collection - it should be an array/object of Promise instances
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.parallel([
 *   makeDelay(1, 30),
 *   makeDelay(2, 20),
 *   makeDelay(3, 10)
 * ])
 * .then(array => {
 *   console.log(array); // [1, 2, 3]
 *   console.log(order); // [3, 2, 1]
 * });
 *
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.parallel({
 *   a: makeDelay(1, 30),
 *   b: makeDelay(2, 20),
 *   c: makeDelay(3, 10)
 * })
 * .then(object => {
 *   console.log(object); // { a: 1, b: 2, c: 3 }
 *   console.log(order); // [3, 2, 1]
 * });
 */
function parallel(collection) {
  return new Parallel(collection)._promise;
}
