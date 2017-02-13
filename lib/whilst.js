'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('./aigle');
const { errorObj, call1, makeCallResolve, makeReject } = require('./internal/util');

class AigleWhilst extends AigleProxy {

  constructor(test, iterator) {
    super();
    this._test = test;
    this._iterator = iterator;
  }

  _iterate(value) {
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
    if (this._test(value)) {
      this._iterate(value);
    } else {
      this._resolve(value);
    }
  }
}

class Whilst extends AigleWhilst {

  constructor(test, iterator, value) {
    super(test, iterator);
    if (test(value)) {
      this._iterate(value);
    } else {
      this._resolve(value);
    }
  }
}

module.exports = { whilst, AigleWhilst };

/**
 * @param {*} [value]
 * @param {Function} test
 * @param {Function} iterator
 */
function whilst(value, test, iterator) {
  if (typeof iterator !== 'function') {
    iterator = test;
    test = value;
    value = undefined;
  }
  return new Whilst(test, iterator, value);
}
