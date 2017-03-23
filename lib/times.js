'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, callProxyReciever, call1 } = require('./internal/util');

class Times extends AigleProxy {

  constructor(times, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    if (isNaN(times) || times < 1) {
      this._promise._resolve([]);
      return;
    }
    this._rest = times;
    this._result = Array(times);
    this._iterator = iterator;
    let i = -1;
    while (++i < times && callProxyReciever(call1(this._iterator, i), this, i)) {}
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

module.exports = times;

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
 * Aigle.times(3, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [2, 1, 0]
 *   });
 */
function times(times, iterator) {
  return new Times(+times, iterator)._promise;
}
