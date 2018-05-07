'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { set, execute } = require('./times');
const { INTERNAL, PENDING, defaultIterator, call1, callProxyReciever } = require('./internal/util');

class TimesSeries extends AigleProxy {
  constructor(times, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._iterator = typeof iterator === 'function' ? iterator : defaultIterator;
    this._index = 0;
    this._rest = undefined;
    this._result = undefined;
    if (times === PENDING) {
      this._rest = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, times);
    }
  }

  _execute() {
    if (this._rest >= 1) {
      this._iterate();
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  }

  _iterate() {
    const i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { timesSeries, TimesSeries };

/**
 * @param {integer} times
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const timer = [30, 20, 10];
 * const iterator = n => {
 *   return Aigle.delay(timer[n])
 *     .then(() => {
 *       order.push(n);
 *       return n;
 *     });
 * };
 * Aigle.timesSeries(3, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [0, 1, 2]
 *   });
 */
function timesSeries(times, iterator) {
  return new TimesSeries(times, iterator)._execute();
}
