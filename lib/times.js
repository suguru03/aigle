'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING, defaultIterator, call1, callProxyReciever } = require('./internal/util');

class Times extends AigleProxy {
  constructor(times, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._iterator = typeof iterator === 'function' ? iterator : defaultIterator;
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
      const { _rest, _iterator } = this;
      let i = -1;
      while (++i < _rest && callProxyReciever(call1(_iterator, i), this, i)) {}
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
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

module.exports = { times, Times, set, execute };

function set(times) {
  times = +times | 0;
  if (times >= 1) {
    this._rest = times;
    this._result = Array(times);
  } else {
    this._rest = 0;
    this._result = [];
  }
}

function execute(times) {
  this._callResolve = this._rest;
  set.call(this, times);
  this._execute();
}

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
  return new Times(times, iterator)._execute();
}
