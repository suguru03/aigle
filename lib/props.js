'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseObjectEach,
  promiseSymbolEach,
  iteratorSymbol
} = require('./internal/util');

class Props extends AigleProxy {

  constructor(object) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = undefined;
    this._result = undefined;
    this._coll = undefined;
    this._keys = undefined;
    if (object === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(object);
    }
  }

  _set(object) {
    this._coll = object;
    if (!object || typeof object !== 'object') {
      this._rest = 0;
      this._result = {};
    } else if (object[iteratorSymbol]) {
      this._result = new Map();
      this._rest = object.size;
      this._callResolve = callResolveMap;
      promiseSymbolEach(this);
    } else {
      const keys = Object.keys(object);
      this._result = {};
      this._rest = keys.length;
      this._keys = keys;
      this._callResolve = callResolve;
      promiseObjectEach(this);
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
