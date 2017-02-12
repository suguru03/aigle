'use strict';

const concatLimit = require('./concatLimit');

module.exports = concatSeries;

function concatSeries(collection, iterator) {
  return concatLimit(collection, 1, iterator);
}
