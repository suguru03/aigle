'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { TimeoutError } = require('./error');
const { INTERNAL } = require('./internal/util');

class Timeout extends AigleProxy {
  constructor(ms, message) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._message = message;
    this._timer = setTimeout(() => {
      message = message || 'operation timed out';
      this._callReject(message instanceof Error ? message : new TimeoutError(message));
    }, ms);
  }

  _callResolve(value) {
    clearTimeout(this._timer);
    this._promise._resolve(value);
  }

  _callReject(reason) {
    clearTimeout(this._timer);
    this._promise._reject(reason);
  }
}

module.exports = Timeout;
