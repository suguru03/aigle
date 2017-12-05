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
    this._result = {};
    this._rest = 0;
    this._coll = undefined;
    this._keys = undefined;
    this._execute = undefined;
    this._callResolve = set;
    if (object !== PENDING) {
      this._set(object);
    }
  }

  _set(object) {
    if (iteratorSymbol && object[iteratorSymbol]) {
      this._result = new Map();
      this._rest = object.size;
      this._coll = object;
      this._keys = undefined;
      this._execute = executeMap;
      this._callResolve = callResolveMap;
    } else {
      const keys = Object.keys(object);
      this._rest = keys.length;
      this._coll = object;
      this._keys = keys;
      this._execute = execute;
      this._callResolve = callResolve;
    }
    return this;
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { props, Props };

function set(object) {
  return this._set(object)._execute();
}

function execute() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    promiseObjectEach(this);
  }
  return this._promise;
}

function executeMap() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    promiseSymbolEach(this);
  }
  return this._promise;
}

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

module.exports = { props, Props };

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
  return new Props(object)._execute();
}
