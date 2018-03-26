'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, callProxyReciever, call1 } = require('./internal/util');

class WhilstTester extends AigleProxy {
  constructor(tester) {
    super();
    this._tester = tester;
    this._proxy = undefined;
    this._value = undefined;
  }

  _test(value) {
    this._value = value;
    callProxyReciever(call1(this._tester, value), this, undefined);
  }

  _callResolve(value) {
    if (value) {
      this._proxy._next(this._value);
    } else {
      this._proxy._promise._resolve(this._value);
    }
  }

  _callReject(reason) {
    this._proxy._callReject(reason);
  }
}

class AigleWhilst extends AigleProxy {
  constructor(tester, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._tester = tester;
    this._iterator = iterator;
    tester._proxy = this;
  }

  _iterate(value) {
    this._callResolve(value);
    return this._promise;
  }

  _next(value) {
    callProxyReciever(call1(this._iterator, value), this, undefined);
  }

  _callResolve(value) {
    this._tester._test(value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
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
