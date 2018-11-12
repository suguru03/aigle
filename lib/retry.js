'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, call0, callProxyReciever } = require('./internal/util');
const DEFAULT_RETRY = 5;

class Retry extends AigleProxy {
  constructor(opts, handler) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._handler = handler;
    this._count = 0;
    this._times = DEFAULT_RETRY;
    this._interval = undefined;
    switch (opts && typeof opts) {
      case 'function':
        this._handler = opts;
        break;
      case 'object':
        const { interval, times } = opts;
        this._times = times || DEFAULT_RETRY;
        this._interval =
          typeof interval === 'function' ? interval : interval ? () => interval : undefined;
        this._iterate = this._iterate.bind(this);
        break;
      default:
        this._times = opts;
        break;
    }
    this._iterate();
  }

  _iterate() {
    callProxyReciever(call0(this._handler), this, undefined);
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }

  _callReject(reason) {
    if (++this._count === this._times) {
      this._promise._reject(reason);
    } else if (this._interval !== undefined) {
      setTimeout(this._iterate, this._interval(this._count));
    } else {
      this._iterate();
    }
  }
}

module.exports = retry;

/**
 * @param {Integer|Object} [times=5]
 * @param {Function} handler
 * @example
 * let called = 0;
 * Aigle.retry(3, () => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 3
 *   console.log(called); // 3
 * });
 *
 * @example
 * let called = 0;
 * Aigle.retry(() => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 5
 *   console.log(called); // 5
 * });
 *
 * @example
 * let called = 0;
 * const opts = {
 *   times: 5,
 *   interval: 10
 * };
 * Aigle.retry(opts, () => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 5
 *   console.log(called); // 5
 * });
 *
 * @example
 * let called = 0;
 * const opts = {
 *   times: 5,
 *   interval: c => c * 2;
 * };
 * Aigle.retry(opts, () => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 5
 *   console.log(called); // 5
 * });
 */
function retry(opts, handler) {
  return new Retry(opts, handler)._promise;
}
