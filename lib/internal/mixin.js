'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('../aigle');
const { INTERNAL, PENDING, apply, callProxyReciever } = require('./util');

module.exports = { createProxy };

/**
 * @private
 * @param {function} func
 */
function createProxy(func) {
  return class extends AigleProxy {
    constructor(...args) {
      super();
      this._promise = new Aigle(INTERNAL);
      this._func = func;
      this._args = args;
      if (args[0] === PENDING) {
        this._set = this._callResolve;
        this._callResolve = this._execute;
      }
    }

    _execute(value) {
      if (this._args[0] === PENDING) {
        this._args[0] = value;
        this._callResolve = this._set;
      }
      callProxyReciever(apply(this._func, this._args), this);
      return this._promise;
    }

    _callResolve(value) {
      this._promise._resolve(value);
    }

    _callReject(reason) {
      this._promise._reject(reason);
    }
  };
}
