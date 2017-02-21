'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, promiseArrayEach } = require('./internal/util');

class AigleAll {

  constructor(array) {
    const size = array.length;
    this.__AIGLE_PROXY__ = true;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._result = Array(size);
    if (size === 0) {
      this._promise._resolve(this._result);
    } else {
      promiseArrayEach(this);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { all, AigleAll };

function all(array) {
  return new AigleAll(array)._promise;
}

