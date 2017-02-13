'use strict';

const { AigleProxy } = require('./aigle');
const { callProxyReciever, call1 } = require('./internal/util');

class WhilstTester extends AigleProxy {

  constructor(tester) {
    super();
    this._tester = tester;
    this._promise = undefined;
    this._promiseValue = undefined;
  }

  _test(value) {
    this._promiseValue = value;
    callProxyReciever(call1(this._tester, value), this, undefined);
  }

  _callResolve(value) {
    if (value) {
      this._promise._next(this._promiseValue);
    } else {
      this._promise._resolve(this._promiseValue);
    }
  }

  _callReject(reason) {
    this._promise._callReject(reason);
  }
}

class AigleWhilst extends AigleProxy {

  constructor(tester, iterator) {
    super();
    tester._promise = this;
    this._tester = tester;
    this._iterator = iterator;
  }

  _iterate(value) {
    this._callResolve(value);
    return this;
  }

  _next(value) {
    callProxyReciever(call1(this._iterator, value), this, undefined);
  }

  _callResolve(value) {
    this._tester._test(value);
  }
}

module.exports = { whilst, AigleWhilst, WhilstTester };

/**
 * @param {*} [value]
 * @param {Function} tester
 * @param {Function} iterator
 */
function whilst(value, tester, iterator) {
  if (typeof iterator !== 'function') {
    iterator = tester;
    tester = value;
    value = undefined;
  }
  return new AigleWhilst(new WhilstTester(tester), iterator)._iterate(value);
}
