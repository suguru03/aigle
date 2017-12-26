'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING, promiseArrayEach } = require('./internal/util');
const { callResolve } = require('./props');

class All extends AigleProxy {

  constructor(array) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = undefined;
    this._coll = undefined;
    this._result = undefined;
    if (array === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(array);
    }
  }

  _set(array) {
    if (Array.isArray(array)) {
      const size = array.length;
      this._rest = size;
      this._coll = array;
      this._result = Array(size);
      this._callResolve = callResolve;
      promiseArrayEach(this);
    } else {
      this._rest = 0;
      this._result = [];
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

module.exports = { all, All };

/**
 * `Aigle.all` is almost the same functionality as `Promise.all`.
 * It will return an Aigle instance.
 * @param {Array} array
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.all([
 *   makeDelay(1, 30),
 *   makeDelay(2, 20),
 *   makeDelay(3, 10)
 * ])
 * .then(array => {
 *   console.log(array); // [1, 2, 3];
 *   console.log(order); // [3, 2, 1];
 * });
 */
function all(array) {
  return new All(array)._promise;
}

