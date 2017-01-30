'use strict';

const { Aigle, INTERNAL } = require('./aigle');

module.exports = delay;

function delay(ms, value) {
  const promise = new Aigle(INTERNAL);
  setTimeout(() => promise._resolve(value), ms);
  return promise;
}
