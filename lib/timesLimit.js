'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  DEFAULT_LIMIT,
  defaultIterator,
  call1,
  callProxyReciever
} = require('./internal/util');

class TimesLimit extends AigleProxy {
  constructor(times, limit, iterator) {
    super();
    if (typeof limit === 'function') {
      iterator = limit;
      limit = DEFAULT_LIMIT;
    }
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._limit = limit;
    this._iterator = typeof iterator === 'function' ? iterator : defaultIterator;
    this._rest = undefined;
    this._result = undefined;
    this._callRest = undefined;
    if (times === PENDING) {
      this._rest = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, times);
    }
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (this._limit--) {
        this._iterate();
      }
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
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  }
}

module.exports = { timesLimit, TimesLimit };

function set(times) {
  times = +times | 0;
  if (times >= 1) {
    this._rest = times;
    this._result = Array(times);
    const { _limit } = this;
    this._limit = _limit < times ? _limit : times;
    this._callRest = times - this._limit;
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
 * @param {integer} [limit=8]
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
 * Aigle.timesLimit(3, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [1, 0, 2]
 *   });
 *
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
 * Aigle.timesLimit(3, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [2, 1, 0]
 *   });
 */
function timesLimit(times, limit, iterator) {
  return new TimesLimit(times, limit, iterator)._execute();
}
