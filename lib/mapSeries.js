'use strict';

const { Aigle } = require('./aigle');
const { MapLimitArray, MapLimitObject } = require('./mapLimit');

module.exports = mapSeries;

function mapSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve();
}
