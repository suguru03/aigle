'use strict';

const { AigleProxy } = require('./aigle');

class Delay extends AigleProxy {

  constructor(ms) {
    super();
    this._ms = ms;
  }

  _callResolve(value) {
    setTimeout(() => this._resolve(value), this._ms);
  }
}

module.exports = { delay, Delay };

function delay(ms, value) {
  const promise = new Delay(ms);
  promise._callResolve(value);
  return promise;
}
