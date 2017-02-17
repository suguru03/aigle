'use strict';

const { AigleProxy } = require('./aigle');
const {
  INTERNAL,
  apply,
  callProxyReciever
} = require('./internal/util');

class Disposer {

  constructor(promise, handler) {
    this._promise = promise;
    this._handler = handler;
  }

  _dispose() {
    return this._handler(this._promise._value);
  }
}

class Using extends AigleProxy {

  constructor(array, handler) {
    super();
    const size = array.length;
    this._rest = size;
    this._array = array;
    this._result = Array(size);
    this._handler = handler;
    this._releasing = false;
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
    this._releasing = true;
    while (l--) {
      const disposer = _array[l];
      if (disposer instanceof Disposer === false) {
        this._callResolve(disposer, l);
      } else {
        callProxyReciever(disposer._dispose(), this, l);
      }
    }
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      this._value = value;
      return this._release();
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._releasing ? this._resolve(this._value) : this._spread();
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
