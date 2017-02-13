'use strict';

const { AigleWhilst } = require('./whilst');

class DoUntil extends AigleWhilst {

  constructor(test, iterator) {
    super(test, iterator);
  }

  _iterate(value) {
    this._next(value);
    return this;
  }

  _callResolve(value) {
    if (this._test(value)) {
      this._resolve(value);
    } else {
      this._next(value);
    }
  }
}

module.exports = doUntil;

/**
 * @param {*} [value]
 * @param {Function} iterator
 * @param {Function} test
 */
function doUntil(value, iterator, test) {
  if (typeof test !== 'function') {
    test = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoUntil(test, iterator)._iterate(value);
}
