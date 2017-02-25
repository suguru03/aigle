'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const {
  INTERNAL,
  call1,
  apply,
  callProxyReciever
} = require('./internal/util');

const SPREAD = {};

class Spread extends AigleProxy {

  constructor(handler, size) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = Array(size);
    this._handler = handler;
  }

  _spread(array) {
    const { _handler } = this;
    if (_handler === undefined) {
      return this._promise._resolve(array);
    }
    switch (typeof array) {
    case 'string':
      array = array.split('');
      break;
    case 'object':
      if (Array.isArray(array)) {
        break;
      }
      if (array) {
        const keys = Object.keys(array);
        let l = keys.length;
        const arr = Array(l);
        while (l--) {
          arr[l] = array[keys[l]];
        }
        array = arr;
        break;
      }
    /* eslint no-fallthrough: 0 */
    default:
    /* eslint no-fallthrough: 1 */
      return callProxyReciever(call1(_handler, array), this, SPREAD);
    }
    callProxyReciever(apply(_handler, array), this, SPREAD);
  }

  _callResolve(value, index) {
    if (index === SPREAD) {
      return this._promise._resolve(value);
    }
    if (index === INTERNAL) {
      return this._spread(value);
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._spread(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { join, Spread };

function join() {
  let l = arguments.length;
  const handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const receiver = new Spread(handler, l);
  while (l--) {
    callProxyReciever(arguments[l], receiver, l);
  }
  return receiver._promise;
}
