'use strict';

const groupByLimit = require('./groupByLimit');

module.exports = groupBySeries;

function groupBySeries(collection, iterator) {
  return groupByLimit(collection, 1, iterator);
}
