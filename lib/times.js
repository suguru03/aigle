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
 */
function times(times, iterator) {
  return new Times(+times, iterator)._promise;
}
