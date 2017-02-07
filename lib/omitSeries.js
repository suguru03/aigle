'use strict';

const { Aigle } = require('./aigle');
const { OmitLimitArray, OmitLimitObject } = require('./omitLimit');

module.exports = omitSeries;

function omitSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new OmitLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new OmitLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve({});
}
