'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('./aigle');

class Race extends AigleProxy {

  constructor(array) {
    super();
    const length = array.length;
    if (length === 0) {
      this._resolve([]);
      return;
    }
    iterate(this, array);
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    this._resolve(value);
  }
}

module.exports = race;

function race(array) {
  return new Race(array);
}

function iterate(promise, array) {
  let l = array.length;
  while (l--) {
    const p = array[l];
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        p._addReceiver(promise, l);
        continue;
      case 1:
        promise._callResolve(p._value, l);
        continue;
      case 2:
        promise._reject(p._value);
        return;
      }
    }
    if (p && p.then) {
      p.then(makeCallback(promise, l), reason => promise._reject(reason));
    } else {
      promise._callResolve(p, l);
    }
  }
}

function makeCallback(promise, index) {
  return function(value) {
    promise._callResolve(value, index);
  };
}
