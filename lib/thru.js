'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callResolve } = require('./internal/util');

function thru(value, onFulfilled) {
  const promise = new Aigle(INTERNAL);
  callResolve(promise, onFulfilled, value);
  return promise;
}

module.exports = thru;
