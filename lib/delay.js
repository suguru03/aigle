'use strict';

const Aigle = require('./aigle');
const { INTERNAL } = require('./internal/util');

class Delay extends Aigle {
  constructor(ms) {
    super(INTERNAL);
    this._ms = ms;
    this._timer = undefined;
  }

  _resolve(value) {
    this._timer = setTimeout(() => Aigle.prototype._resolve.call(this, value), this._ms);
    return this;
  }

  _reject(reason) {
    clearTimeout(this._timer);
    Aigle.prototype._reject.call(this, reason);
  }
}

module.exports = { delay, Delay };

/**
 * Return a promise which will be resolved with `value` after `ms`.
 * @param {number} ms
 * @param {*} value
 * @return {Aigle} Returns an Aigle instance
 * @example
 * Aigle.delay(10)
 *   .then(value => console.log(value); // undefined
 *
 * @example
 * Aigle.delay(10, 'test')
 *   .then(value => console.log(value); // 'test'
 */
function delay(ms, value) {
  return new Delay(ms)._resolve(value);
}
