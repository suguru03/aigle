'use strict';

const { Aigle } = require('./aigle');
const { TimeoutError } = require('./error');
const { INTERNAL } = require('./internal/util');

class Timeout {

  constructor(ms, message) {
    this.__AIGLE_PROXY__ = true;
    this._promise = new Aigle(INTERNAL);
    this._message = message;
    this._timer = setTimeout(() => {
      if (message instanceof Error) {
        this._callReject(message);
      } else {
        this._callReject(new TimeoutError('operation timed out'));
      }
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
