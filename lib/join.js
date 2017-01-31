'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('./aigle');
const {
  errorObj,
  apply,
  makeResolve,
  makeReject,
  promiseArrayEach
} = require('./internal/util');

class Join extends AigleProxy {

  constructor(array, handler) {
    super();
    this._handler = handler;
    promiseArrayEach(this, array);
  }

  _spread() {
    const { _result } = this;
    if (this._handler === undefined) {
      return this._resolve(_result);
    }
    const p = apply(this._handler, _result);
    if (p === errorObj) {
      return this._reject(errorObj.e);
    }
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        return p._addReceiver(this);
      case 1:
        return this._callResolve(p._value);
      case 2:
        return this._reject(p._value);
      }
    }
    if (p && p.then) {
      p.then(makeResolve(this), makeReject(this));
    } else {
      this._callResolve(p);
    }
  }

  _callResolve(value, index) {
    if (this._rest === 0) {
      return this._resolve(value);
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._spread();
    }
  }
}

module.exports = { join, Join };

function join() {
  let l = arguments.length;
  const handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const array = Array(l);
  while (l--) {
    array[l] = arguments[l];
  }
  return new Join(array, handler);
}
