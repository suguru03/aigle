'use strict';

const { Aigle } = require('./aigle');
const { AigleAll } = require('./all');
const { AigleProps } = require('./props');

module.exports = parallel;

function parallel(collection) {
  if (Array.isArray(collection)) {
    return new AigleAll(collection)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new AigleProps(collection)._promise;
  }
  return Aigle.resolve({});
}

