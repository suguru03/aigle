'use strict';

const { AigleProxy } = require('./aigle');
const { TimeoutError } = require('./error');

class Timeout extends AigleProxy {

  constructor(ms, message) {
    super();
    this._message = message;
    this._timer = setTimeout(() => {
      if (message instanceof Error) {
        this._reject(message);
      } else {
        this._reject(new TimeoutError('operation timed out'));
      }
    }, ms);
  }

  _callResolve(value) {
    clearTimeout(this._timer);
    this._resolve(value);
  }

  _callReject(reason) {
    clearTimeout(this._timer);
    this._reject(reason);
  }
}

module.exports = Timeout;
