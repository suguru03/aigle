'use strict';

const { AigleProxy } = require('./aigle');
const { call0, callProxyReciever } = require('./internal/util');
const DEFAULT_RETRY = 5;

class Retry extends AigleProxy {

  constructor(handler, times) {
    super();
    this._rest = times;
    this._handler = handler;
    this._next();
  }

  _next() {
    callProxyReciever(call0(this._handler), this, undefined);
  }

  _callReject(reason) {
    if (--this._rest === 0) {
      this._reject(reason);
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
  return new Retry(handler, times);
}
