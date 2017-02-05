'use strict';

const { Aigle } = require('./aigle');
const { FilterLimitArray, FilterLimitObject } = require('./filterLimit');

module.exports = filterSeries;

function filterSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FilterLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FilterLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve([]);
}
