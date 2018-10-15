'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('../aigle');
const { map } = require('../map');
const { mapValues } = require('../mapValues');
const { INTERNAL, PENDING, apply, callProxyReciever } = require('./util');

module.exports = { createProxy };

class MixinProxy extends AigleProxy {
  constructor(func, exec, args) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._func = func;
    this._args = args;
    this._execute = exec;
    if (args[0] === PENDING) {
      this._set = this._callResolve;
      this._callResolve = exec;
    }
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

function execute(value) {
  const { _args } = this;
  if (_args[0] === PENDING) {
    _args[0] = value;
    this._callResolve = this._set;
  }
  callProxyReciever(apply(this._func, _args), this);
  return this._promise;
}

function executeWithPromisify(value) {
  const { _args } = this;
  if (_args[0] === PENDING) {
    _args[0] = value;
    this._callResolve = this._set;
  } else {
    value = _args[0];
  }
  const iterator = _args[1];
  const isFunc = typeof iterator === 'function';
  if (isFunc && Array.isArray(value)) {
    callIterator(this, map, array => {
      let index = 0;
      _args[1] = () => array[index++];
      callProxyReciever(apply(this._func, _args), this);
    });
  } else if (isFunc && value && typeof value === 'object') {
    callIterator(this, mapValues, object => {
      let index = 0;
      const keys = Object.keys(object);
      _args[1] = () => object[keys[index++]];
      callProxyReciever(apply(this._func, _args), this);
    });
  } else {
    callProxyReciever(apply(this._func, _args), this);
  }
  return this._promise;
}

function callIterator(proxy, func, onFulfilled) {
  const [collection, iterator] = proxy._args;
  const p = func(collection, (value, key) => iterator(value, key, collection));
  return p._resolved === 1
    ? onFulfilled(p._value)
    : p.then(onFulfilled, error => proxy._callReject(error));
}

/**
 * @private
 * @param {function} func
 * @param {boolean} promisify
 */
function createProxy(func, promisify) {
  const exec = promisify ? executeWithPromisify : execute;
  return class extends MixinProxy {
    constructor(...args) {
      super(func, exec, args);
    }
  };
}
