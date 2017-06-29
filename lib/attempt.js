'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callResolve } = require('./internal/util');

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
