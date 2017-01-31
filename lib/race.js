'use strict';

const { AigleProxy } = require('./aigle');
const { promiseArrayEach } = require('./internal/util');

class Race extends AigleProxy {

  constructor(array) {
    super();
    promiseArrayEach(this, array);
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
  return new Race(array);
}
