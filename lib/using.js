'use strict';

const { AigleProxy } = require('./aigle');
const {
  INTERNAL,
  apply,
  call1,
  callProxyReciever
} = require('./internal/util');

const DISPOSER = {};

class Disposer {

  constructor(promise, handler) {
    this._promise = promise;
    this._handler = handler;
  }

  _dispose() {
    return call1(this._handler, this._promise._value);
  }
}

class Using extends AigleProxy {

  constructor(array, handler) {
    super();
    const size = array.length;
    this._rest = size;
    this._disposed = size;
    this._array = array;
    this._result = Array(size);
    this._handler = handler;
    this._iterate();
  }

  _iterate() {
    const { _rest, _array } = this;
    let i = -1;
    while (++i < _rest) {
      const disposer = _array[i];
      if (disposer instanceof Disposer === false) {
        callProxyReciever(disposer, this, i);
      } else {
        callProxyReciever(disposer._promise, this, i);
      }
    }
  }

  _spread() {
    const { _handler, _result } = this;
    if (_handler === undefined) {
      return this._callResolve(_result, INTERNAL);
    }
    callProxyReciever(apply(_handler, _result), this, INTERNAL);
  }

  _release() {
    const { _array } = this;
    let l = _array.length;
    this._rest = l;
    while (l--) {
      const disposer = _array[l];
      if (disposer instanceof Disposer === false) {
        this._callResolve(disposer, DISPOSER);
      } else {
        callProxyReciever(disposer._dispose(), this, DISPOSER);
      }
    }
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      this._result = value;
      return this._release();
    }
    if (index === DISPOSER) {
      if (--this._disposed === 0) {
        this._resolve(this._result);
      }
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._spread();
    }
  }
}

module.exports = { using, Disposer };

function using() {
  let l = arguments.length;
  const handler = arguments[--l];
  const array = Array(l);
  while (l--) {
    array[l] = arguments[l];
  }
  return new Using(array, handler);
}
