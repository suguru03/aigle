'use strict';

const { AigleProxy } = require('./aigle');
const { promiseArrayEach } = require('./internal/util');

class AigleAll extends AigleProxy {

  constructor() {
    super();
    this._rest = undefined;
    this._result = undefined;
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = { all, AigleAll };

function all(array) {
  const promise = new AigleAll(array);
  promiseArrayEach(promise, array);
  return promise;
}

