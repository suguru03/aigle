'use strict';

const { Aigle } = require('./aigle');
const { PickLimitArray, PickLimitObject } = require('./pickLimit');

module.exports = pickSeries;

function pickSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new PickLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new PickLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve({});
}
