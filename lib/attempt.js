'use strict';

const { Aigle, callResolve } = require('./aigle');
const { INTERNAL } = require('./internal/util');

module.exports = attempt;

/**
 * @param {function} handler
 * @return {Aigle} Returns an Aigle instance
 * @example
 * Aigle.attempt(() => {
 *     throw Error('error');
 *   })
 *   .catch(error => console.log(error)); // error
 */
function attempt(handler) {
  const receiver = new Aigle(INTERNAL);
  callResolve(receiver, handler);
  return receiver;
}
