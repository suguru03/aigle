'use strict';

const { AigleWhilst } = require('./whilst');

class DoWhilst extends AigleWhilst {

  constructor(test, iterator, value) {
    super(test, iterator);
    this._iterate(value);
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
  }
  return new DoWhilst(test, iterator, value);
}
