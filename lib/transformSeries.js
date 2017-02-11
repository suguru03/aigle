'use strict';

const transformLimit = require('./transformLimit');

module.exports = transformSeries;

/**
 * @param {Array|Object} collection
 * @param {Array|Object} [accumulator]
 * @param {Function} iterator
 */
function transformSeries(collection, accumulator, iterator) {
  return transformLimit(collection, 1, accumulator, iterator);
}
