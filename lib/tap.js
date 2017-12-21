'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callResolve } = require('./internal/util');

// TODO refactor
function tap(value, onFulfilled) {
  const promise = new Aigle(INTERNAL);
  callResolve(promise, onFulfilled, value);
  return promise.then(() => value);
}

module.exports = tap;
