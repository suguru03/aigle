'use strict';

const { AigleWhilst, WhilstTester } = require('./whilst');

class DoWhilst extends AigleWhilst {

  constructor(test, iterator) {
    super(test, iterator);
  }

  _iterate(value) {
    this._next(value);
    return this._promise;
  }
}

module.exports = { doWhilst, DoWhilst };

/**
 * @param {*} [value]
 * @param {Function} iterator
 * @param {Function} tester
 */
function doWhilst(value, iterator, tester) {
  if (typeof tester !== 'function') {
    tester = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoWhilst(new WhilstTester(tester), iterator)._iterate(value);
}
