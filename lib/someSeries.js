'use strict';

const someLimit = require('./someLimit');

module.exports = someSeries;

function someSeries(collection, iterator) {
  return someLimit(collection, 1, iterator);
}
