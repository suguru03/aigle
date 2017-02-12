'use strict';

const everyLimit = require('./everyLimit');

module.exports = everySeries;

function everySeries(collection, iterator) {
  return everyLimit(collection, 1, iterator);
}
