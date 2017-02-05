'use strict';

const { Aigle } = require('./aigle');
const { RejectLimitArray, RejectLimitObject } = require('./rejectLimit');

module.exports = rejectSeries;

function rejectSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new RejectLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new RejectLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve([]);
}
