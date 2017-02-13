'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('./aigle');
const { errorObj, call1, makeCallResolve, makeReject } = require('./internal/util');

class WhilstTester extends AigleProxy {

  constructor(tester) {
    super();
    this._tester = tester;
    this._promise = undefined;
    this._promiseValue = undefined;
  }

  _test(value) {
    this._promiseValue = value;
    const promise = call1(this._tester, value);
    if (promise === errorObj) {
      this._reject(errorObj.e);
      return;
    }
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(this);
        return;
      case 1:
        promise._callResolve(this);
        return;
      case 2:
        this._reject(promise._value);
        return;
      }
    }
    if (promise && promise.then) {
      promise.then(makeCallResolve(this), makeReject(this));
    } else {
      this._callResolve(promise);
    }
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

  _test(value) {
    this._tester._test(value);
  }

  _next(value) {
    const promise = call1(this._iterator, value);
    if (promise === errorObj) {
      this._reject(errorObj.e);
      return;
    }
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(this);
        return;
      case 1:
        promise._callResolve(this);
        return;
      case 2:
        this._reject(promise._value);
        return;
      }
    }
    if (promise && promise.then) {
      promise.then(makeCallResolve(this), makeReject(this));
    } else {
      this._callResolve(promise);
    }
  }

  _callResolve(value) {
    this._test(value);
  }
}

module.exports = { whilst, AigleWhilst };

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
