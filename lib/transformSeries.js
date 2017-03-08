'use strict';

const transformLimit = require('./transformLimit');

module.exports = transformSeries;

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 */
function transformSeries(collection, iterator, accumulator) {
  return transformLimit(collection, 1, iterator, accumulator);
}
