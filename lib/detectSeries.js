'use strict';

const { Aigle } = require('./aigle');
const { DetectLimitArray, DetectLimitObject } = require('./detectLimit');

module.exports = detectSeries;

function detectSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new DetectLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new DetectLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve();
}
