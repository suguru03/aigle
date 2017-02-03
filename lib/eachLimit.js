'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

module.exports = eachLimit;

function eachLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new AigleLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new AigleLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve();
}

