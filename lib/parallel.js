'use strict';

const { Aigle } = require('./aigle');
const { AigleAll } = require('./all');
const { AigleProps } = require('./props');

module.exports = parallel;

/**
 * @param {Array|Object} collection - it should be an array/object of Promise instances
 * @example
 * Aigle.parallel([
 *   new Aigle(resolve => resolve(1)),
 *   Aigle.delay(20).then(() => 2),
 *   Aigle.delay(30).then(() => 3),
 *   4
 * ])
 * .then(array => console.log(array)); // [1, 2, 3]
 *
 * @example
 * Aigle.parallel({
 *   a: new Aigle(resolve => resolve(1)),
 *   b: Aigle.delay(20).then(() => 2),
 *   c: Aigle.delay(30).then(() => 3),
 *   d: 4
 * })
 * .then(object => console.log(object)); // { a: 1, b: 2, c: 3, d: 4 }
 */
function parallel(collection) {
  if (Array.isArray(collection)) {
    return new AigleAll(collection)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new AigleProps(collection)._promise;
  }
  return Aigle.resolve({});
}

