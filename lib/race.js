'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, promiseArrayEach } = require('./internal/util');

class Race extends AigleProxy {

  constructor(array) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    if (size === 0) {
      this._promise._resolve();
    } else {
      promiseArrayEach(this);
    }
  }

  _callResolve(value) {
    this._promise._resolved === 0 && this._promise._resolve(value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = race;

function race(array) {
  return new Race(array)._promise;
}
