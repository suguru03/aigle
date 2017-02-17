'use strict';

const { Aigle } = require('./aigle');
const { AigleAll } = require('./all');
const { AigleProps } = require('./props');
const { promiseArrayEach } = require('./internal/util');

module.exports = parallel;

function parallel(collection) {
  if (Array.isArray(collection)) {
    new AigleAll(collection);
    const promise = new AigleAll(collection);
    promiseArrayEach(promise, collection);
    return promise;
  }
  if (collection && typeof collection === 'object') {
    return new AigleProps(collection);
  }
  return Aigle.resolve({});
}

