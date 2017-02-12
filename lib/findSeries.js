'use strict';

const { Aigle } = require('./aigle');
const { FindLimitArray, FindLimitObject } = require('./findLimit');

module.exports = findSeries;

function findSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FindLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FindLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve();
}
