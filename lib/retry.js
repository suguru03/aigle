'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, call0, callProxyReciever } = require('./internal/util');
const DEFAULT_RETRY = 5;

class Retry extends AigleProxy {

  constructor(handler, times) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = times;
    this._handler = handler;
    this._next();
  }

  _next() {
    callProxyReciever(call0(this._handler), this, undefined);
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }

  _callReject(reason) {
    if (--this._rest === 0) {
      this._promise._reject(reason);
    } else {
      this._next();
    }
  }

}

module.exports = retry;

/**
 * @param {Integer} [times]
 * @param {Function} handler
 */
function retry(times, handler) {
  if (typeof times === 'function') {
    handler = times;
    times = DEFAULT_RETRY;
  }
  return new Retry(handler, times)._promise;
}
