'use strict';

const { Aigle } = require('./aigle');
const { AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

module.exports = eachSeries;

function eachSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new AigleLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new AigleLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve();
}

