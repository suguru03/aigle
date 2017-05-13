'use strict';

const { AigleProxy } = require('aigle-core');

const { Aigle } = require('./aigle');
const { INTERNAL, PENDING, promiseArrayEach } = require('./internal/util');

class All extends AigleProxy {

  constructor(array) {
    super();
    this._promise = new Aigle(INTERNAL);
    if (array === PENDING) {
      this._rest = undefined;
      this._coll = undefined;
      this._result = undefined;
      this._execute = this._callResolve;
      this._callResolve = set;
    } else {
      const size = array.length;
      this._rest = size;
      this._coll = array;
      this._result = Array(size);
      this._execute = execute;
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { all, All };

function set(array) {
  const size = array.length;
  this._rest = size;
  this._coll = array;
  this._result = Array(size);
  this._callResolve = this._execute;
  execute.call(this);
  return this;
}

function execute() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    promiseArrayEach(this);
  }
  return this._promise;
}

/**
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
  return new All(array)._execute();
}

