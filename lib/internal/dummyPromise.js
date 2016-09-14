'use strict';

class DummyPromise {

  constructor(callResolve, callReject) {
    this._resolve = callResolve;
    this._reject = callReject;
  }
}

module.exports = DummyPromise;
