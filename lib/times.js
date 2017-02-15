'use strict';

const { AigleProxy } = require('./aigle');
const { callProxyReciever, call1 } = require('./internal/util');

class Times extends AigleProxy {

  constructor(times, iterator) {
    super();
    if (isNaN(times) || times < 1) {
      this._resolve([]);
      return;
    }
    this._rest = times;
    this._result = Array(times);
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest } = this;
    while (++i < _rest && callProxyReciever(call1(this._iterator, i), this, i)) {}
    return this;
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = times;

/**
 * @param {integer} times
 * @param {Function} iterator
 */
function times(times, iterator) {
  return new Times(+times, iterator)._iterate();
}
