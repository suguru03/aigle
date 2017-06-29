'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING, promiseObjectEach } = require('./internal/util');

class Props extends AigleProxy {

  constructor(object) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._result = {};
    if (object === PENDING) {
      this._rest = undefined;
      this._coll = undefined;
      this._keys = undefined;
      this._execute = this._callResolve;
      this._callResolve = set;
    } else {
      const keys = Object.keys(object);
      this._rest = keys.length;
      this._coll = object;
      this._keys = keys;
      this._execute = execute;
    }
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { props, Props };

function set(object) {
  const keys = Object.keys(object);
  this._rest = keys.length;
  this._coll = object;
  this._keys = keys;
  this._callResolve = this._execute;
  execute.call(this);
  return this;
}

function execute() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    promiseObjectEach(this);
  }
  return this._promise;
}

module.exports = { props, Props };

/**
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
