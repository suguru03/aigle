'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

module.exports = map;

function map(collection, iterator) {
  if (Array.isArray(collection)) {
    return new AigleEachArray(collection, iterator);
  }
  if (collection && typeof collection === 'object') {
    return new AigleEachObject(collection, iterator);
  }
  return Aigle.resolve();
}
