'use strict';

const { AigleProxy } = require('./aigle');
const { promiseArrayEach } = require('./internal/util');

class All extends AigleProxy {

  constructor(array) {
    super();
    promiseArrayEach(this, array);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = all;

function all(array) {
  return new All(array);
}

