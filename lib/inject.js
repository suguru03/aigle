'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const {
  INTERNAL,
  errorObj,
  call0,
  callProxyReciever
} = require('./internal/util');

const FN_ARGS = /^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m;
const FN_ARG_SPLIT = /,/;
const FN_ARG = /(=.+)?(\s*)$/;
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

class Inject extends AigleProxy {

  constructor(handler) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._handler = handler;
    this._params = parseParams(handler);
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      return this._promise._resolve(value);
    }
    const { _handler, _params } = this;
    if (typeof value !== 'object') {
      return callProxyReciever(call0(_handler), this, INTERNAL);
    }
    callProxyReciever(inject(_handler, _params, value), this, INTERNAL);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = Inject;

/**
 * @private
 * @param {function} handler
 */
function parseParams(handler) {
  handler = handler.toString().replace(STRIP_COMMENTS, '');
  handler = handler.match(FN_ARGS)[2].replace(' ', '');
  handler = handler ? handler.split(FN_ARG_SPLIT) : [];
  const result = Array(handler.length);
  let l = result.length;
  while (l--) {
    result[l] = handler[l].replace(FN_ARG, '').trim();
  }
  return result;
}

/**
 * @private
 * @param {function} handler
 * @param {Array} params
 * @param {Object} result
 */
function inject(handler, params, result) {
  try {
    switch (params.length) {
    case 0:
      return handler();
    case 1:
      return handler(result[params[0]]);
    case 2:
      return handler(result[params[0]], result[params[1]]);
    case 3:
      return handler(result[params[0]], result[params[1]], result[params[2]]);
    default:
      let l = params.length;
      while (l--) {
        params[l] = result[params[l]];
      }
      return handler.apply(null, params);
    }
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}
