'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, DEFAULT_LIMIT, callProxyReciever, call1 } = require('./internal/util');

class TimesLimit extends AigleProxy {

  constructor(times, iterator, limit) {
    super();
    this._promise = new Aigle(INTERNAL);
    if (isNaN(times) || times < 1 || isNaN(times) || limit < 1) {
      this._promise._resolve([]);
      return;
    }
    limit = limit > times ? times : limit;
    this._index = 0;
    this._rest = times;
    this._size = times;
    this._result = Array(times);
    this._iterator = iterator;
    while (limit--) {
      this._next();
    }
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  }

  _callResolve(value, index) {

    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
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
  return new TimesLimit(+times, iterator, +limit)._promise;
}
