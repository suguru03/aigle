'use strict';

const sortByLimit = require('./sortByLimit');

module.exports = sortBySeries;

function sortBySeries(collection, iterator) {
  return sortByLimit(collection, 1, iterator);
}
