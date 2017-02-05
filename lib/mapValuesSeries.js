'use strict';

const { Aigle } = require('./aigle');
const { MapValuesLimitArray, MapValuesLimitObject } = require('./mapValuesLimit');

module.exports = mapValuesSeries;

function mapValuesSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapValuesLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapValuesLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve({});
}
