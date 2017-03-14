'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const {
  INTERNAL,
  call1,
  apply,
  callProxyReciever
} = require('./internal/util');

class Join extends AigleProxy {

  constructor(handler, size) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = Array(size);
    this._handler = handler;
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      return this._promise._resolve(value);
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      spread(this, this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class Spread extends AigleProxy {

  constructor(handler) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._handler = handler;
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      return this._promise._resolve(value);
    }
    spread(this, value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { join, Spread };

function join() {
  let l = arguments.length;
  const handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const receiver = new Join(handler, l);
  while (l--) {
    callProxyReciever(arguments[l], receiver, l);
  }
  return receiver._promise;
}

function spread(proxy, array) {
  const { _handler } = proxy;
  if (_handler === undefined) {
    return proxy._promise._resolve(array);
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
    return callProxyReciever(call1(_handler, array), proxy, INTERNAL);
  }
  callProxyReciever(apply(_handler, array), proxy, INTERNAL);
}
