'use strict';

const { Aigle } = require('./aigle');
const { AigleAll } = require('./all');
const { AigleProps } = require('./props');
const { promiseArrayEach, promiseObjectEach } = require('./internal/util');

module.exports = parallel;

function parallel(collection) {
  if (Array.isArray(collection)) {
    new AigleAll(collection);
    const promise = new AigleAll();
    promiseArrayEach(promise, collection);
    return promise;
  }
  if (collection && typeof collection === 'object') {
    const promise = new AigleProps();
    promiseObjectEach(promise, collection);
    return promise;
  }
  return Aigle.resolve({});
}

