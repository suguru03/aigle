'use strict';

const { AigleWhilst } = require('./whilst');

class Until extends AigleWhilst {

  constructor(test, iterator) {
    super(test, iterator);
  }

  _iterate(value) {
    this._callResolve(value);
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

module.exports = until;

/**
 * @param {*} [value]
 * @param {Function} test
 * @param {Function} iterator
 */
function until(value, test, iterator) {
  if (typeof iterator !== 'function') {
    iterator = test;
    test = value;
    value = undefined;
  }
  return new Until(test, iterator)._iterate(value);
}
