'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('./aigle');

class AigleProps extends AigleProxy {

  constructor(collection) {
    super();
    const keys = Object.keys(collection);
    const length = keys.length;
    if (length === 0) {
      this._resolve({});
      return;
    }
    this._rest = length;
    this._result = {};
    iterate(this, collection, keys);
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = props;

function props(collection) {
  return new AigleProps(collection);
}

function iterate(promise, collection, keys) {
  let l = keys.length;
  while (l--) {
    const key = keys[l];
    const p = collection[key];
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        p._addReceiver(promise, key);
        continue;
      case 1:
        promise._callResolve(p._value, key);
        continue;
      case 2:
        promise._reject(p._value);
        return;
      }
    }
    if (p && p.then) {
      p.then(makeCallback(promise, key), reason => promise._reject(reason));
    } else {
      promise._callResolve(p, key);
    }
  }
}

function makeCallback(promise, key) {
  return function(value) {
    promise._callResolve(value, key);
  };
}
