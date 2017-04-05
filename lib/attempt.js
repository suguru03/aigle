'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const {
  INTERNAL,
  call0,
  callProxyReciever
} = require('./internal/util');

class Attempt extends AigleProxy {

  constructor() {
    super();
    this._promise = new Aigle(INTERNAL);
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

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
  const receiver = new Attempt();
  callProxyReciever(call0(handler), receiver);
  return receiver._promise;
}
