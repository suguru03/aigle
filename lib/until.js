'use strict';

const { AigleWhilst } = require('./whilst');

class Until extends AigleWhilst {

  constructor(test, iterator, value) {
    super(test, iterator);
    if (test(value)) {
      this._resolve(value);
    } else {
      this._iterate(value);
    }
  }

  _callResolve(value) {
    if (this._test(value)) {
      this._resolve(value);
    } else {
      this._iterate(value);
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
  return new Until(test, iterator, value);
}
