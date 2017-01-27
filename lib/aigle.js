'use strict';

const { Aigle, INTERNAL } = require('aigle-core');

Aigle.resolve = resolve;
Aigle.reject = reject;

Aigle.join = require('./join');
Aigle.promisify = require('./promisify');
Aigle.all = require('./all');

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
