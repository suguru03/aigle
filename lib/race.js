'use strict';

const { AigleProxy } = require('./aigle');
const { promiseArrayEach } = require('./internal/util');

class Race extends AigleProxy {

  constructor() {
    super();
    this._rest = undefined;
    this._result = undefined;
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    this._resolve(value);
  }
}

module.exports = race;

function race(array) {
  const promise = new Race();
  promiseArrayEach(promise, array);
  return promise;
}
