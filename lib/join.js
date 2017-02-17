'use strict';

const { AigleProxy } = require('./aigle');
const {
  INTERNAL,
  apply,
  callProxyReciever
} = require('./internal/util');

class Spread extends AigleProxy {

  constructor(handler, size) {
    super();
    this._rest = size;
    this._result = Array(size);
    this._handler = handler;
  }

  _spread(array) {
    const { _handler } = this;
    if (_handler === undefined) {
      return this._resolve(array);
    }
    callProxyReciever(apply(_handler, array), this, INTERNAL);
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      return this._resolve(value);
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._spread(this._result);
    }
  }
}

module.exports = { join, Spread };

function join() {
  let l = arguments.length;
  const handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const promise = new Spread(handler, l);
  while (l--) {
    callProxyReciever(arguments[l], promise, l);
  }
  return promise;
}
