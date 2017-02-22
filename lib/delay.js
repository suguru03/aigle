'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL } = require('./internal/util');

class Delay {

  constructor(ms) {
    this._promise = new Aigle(INTERNAL);
    this.__AIGLE_PROXY__ = true;
    this._ms = ms;
  }

  _callResolve(value) {
    setTimeout(() => this._promise._resolve(value), this._ms);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { delay, Delay };

function delay(ms, value) {
  const delay = new Delay(ms);
  delay._callResolve(value);
  return delay._promise;
}
