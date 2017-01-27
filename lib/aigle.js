'use strict';

const { Aigle, AigleProxy, INTERNAL } = require('aigle-core');

const AigleArray = require('./internal/aigleArray')(Aigle, AigleProxy);

Aigle.resolve = resolve;
Aigle.reject = reject;

Aigle.join = require('./join')(Aigle, AigleArray);
Aigle.promisify = require('./promisify')(Aigle, INTERNAL);

Aigle.all = require('./all')(AigleArray);

function resolve(value) {
  const promise = new Aigle(INTERNAL);
  promise._resolve(value);
  return promise;
}

function reject(reason) {
  const promise = new Aigle(INTERNAL);
  promise._reject(reason);
  return promise;
}

module.exports = Aigle;
