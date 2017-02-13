'use strict';

const { AigleWhilst } = require('./whilst');

class DoWhilst extends AigleWhilst {

  constructor(test, iterator) {
    super(test, iterator);
  }

  _iterate(value) {
    this._next(value);
    return this;
  }
}

module.exports = doWhilst;

/**
 * @param {*} [value]
 * @param {Function} iterator
 * @param {Function} test
 */
function doWhilst(value, iterator, test) {
  if (typeof test !== 'function') {
    test = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoWhilst(test, iterator)._iterate(value);
}