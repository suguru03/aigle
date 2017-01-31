'use strict';

const AigleCore = require('aigle-core');

module.exports = {
  makeResolve,
  makeReject,
  arrayEach,
  baseEach
};

function makeResolve(promise, key) {
  return function(value) {
    promise._callResolve(value, key);
  };
}

function makeReject(promise) {
  return function(reason) {
    promise._callReject(reason);
  };
}

function arrayEach(promise, array, iterator) {
  const size = array.length;
  if (size === 0) {
    promise._resolve();
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = array;
  while (++i < size) {
    const p = iterator(array[i], i);
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        p._addReceiver(promise, i);
        continue;
      case 1:
        promise._callResolve(p._value, i);
        continue;
      case 2:
        promise._reject(p._value);
        return;
      }
    }
    if (p && p.then) {
      p.then(makeResolve(promise, i), makeReject(promise));
    } else {
      promise._callResolve(p, i);
    }
  }
}

function baseEach(promise, object, iterator) {
  const keys = Object.keys(object);
  const size = keys.length;
  if (size === 0) {
    promise._resolve();
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = {};
  while (++i < size) {
    const key = keys[i];
    const p = iterator(object[key], key);
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
      p.then(makeResolve(promise, key), makeReject(promise));
    } else {
      promise._callResolve(p, key);
    }
  }
}
