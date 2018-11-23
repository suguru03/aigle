'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING, promiseObjectEach, promiseMapEach } = require('./internal/util');

class Props extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = 0;
    this._result = undefined;
    if (coll === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(coll);
    }
  }

  _set(coll) {
    if (typeof coll !== 'object' || coll === null) {
      this._result = {};
    } else if (coll instanceof Map) {
      const result = new Map();
      this._result = result;
      this._rest = coll.size;
      this._callResolve = callResolveMap;
      promiseMapEach(this, Infinity, coll, result);
    } else {
      const keys = Object.keys(coll);
      const size = keys.length;
      const result = {};
      this._result = result;
      this._rest = size;
      this._callResolve = callResolve;
      promiseObjectEach(this, size, coll, result, keys);
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

module.exports = { props, Props, callResolve, callResolveMap };

function callResolve(value, key) {
  this._result[key] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveMap(value, key) {
  this._result.set(key, value);
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.props` is almost the same functionality as [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all)
 * But the function allows an object as the first argument instead of an array.
 * @param {Object} object
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.props({
 *   a: makeDelay(1, 30),
 *   b: makeDelay(2, 20),
 *   c: makeDelay(3, 10)
 * })
 * .then(object => {
 *   console.log(object); // { a: 1, b: 2, c: 3 }
 *   console.log(order); // [3, 2, 1]
 * });
 */
function props(object) {
  return new Props(object)._promise;
}
