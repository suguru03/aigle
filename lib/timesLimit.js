'use strict';

const { AigleProxy } = require('./aigle');
const { DEFAULT_LIMIT, callProxyReciever, call1 } = require('./internal/util');

class TimesLimit extends AigleProxy {

  constructor(times, iterator, limit) {
    super();
    if (isNaN(times) || times < 1 || isNaN(times) || limit < 1) {
      this._limit = 0;
      this._rest = 0;
      this._resolve([]);
      return;
    }
    this._index = 0;
    this._limit = limit > times ? times : limit;
    this._rest = times;
    this._size = times;
    this._result = Array(times);
    this._iterator = iterator;
  }

  _iterate() {
    while (this._limit--) {
      this._next();
    }
    return this;
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  }

  _callResolve(value, index) {
    if (this._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = timesLimit;

/**
 * @param {integer} times
 * @param {integer} [limit]
 * @param {Function} iterator
 */
function timesLimit(times, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  return new TimesLimit(+times, iterator, +limit)._iterate();
}
