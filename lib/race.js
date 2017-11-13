'use strict';

const { Parallel } = require('./parallel');

class Race extends Parallel {

  constructor(collection) {
    super(collection);
    this._result = undefined;
    if (this._rest === 0) {
      this._rest = -1;
    }
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }
}

module.exports = { race, Race };

/**
 * @param {Object|Array} collection
 * @example
 * Aigle.race([
 *   new Aigle(resolve => setTimeout(() => resolve(1), 30)),
 *   new Aigle(resolve => setTimeout(() => resolve(2), 20)),
 *   new Aigle(resolve => setTimeout(() => resolve(3), 10))
 * ])
 * .then(value => console.log(value)); // 3
 *
 * @example
 * Aigle.race({
 *   a: new Aigle(resolve => setTimeout(() => resolve(1), 30)),
 *   b: new Aigle(resolve => setTimeout(() => resolve(2), 20)),
 *   c: new Aigle(resolve => setTimeout(() => resolve(3), 10))
 * })
 * .then(value => console.log(value)); // 3
 */
function race(collection) {
  return new Race(collection)._execute();
}
