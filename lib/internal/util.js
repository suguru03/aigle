'use strict';

const AigleCore = require('aigle-core');
const errorObj = { e: undefined };

module.exports = {
  errorObj,
  call,
  call2,
  apply,
  makeResolve,
  makeReject,
  makeCallResolve,
  promiseArrayEach,
  promiseObjectEach
};

function call(func, value) {
  try {
    return func(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call2(func, arg1, arg2) {
  try {
    return func(arg1, arg2);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function apply(handler, array) {
  try {
    switch (array.length) {
    case 0:
      return handler();
    case 1:
      return handler(array[0]);
    case 2:
      return handler(array[0], array[1]);
    case 3:
      return handler(array[0], array[1], array[2]);
    default:
      return handler.apply(null, array);
    }
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function makeResolve(promise) {
  return function(value) {
    promise._resolve(value);
  };
}

function makeReject(promise) {
  return function(reason) {
    promise._reject(reason);
  };
}

function makeCallResolve(promise, key) {
  return function(value) {
    promise._callResolve(value, key);
  };
}

function promiseArrayEach(promise, array) {
  const size = array.length;
  if (size === 0) {
    promise._resolve([]);
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = array;
  while (++i < size) {
    const p = array[i];
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
      p.then(makeCallResolve(promise, i), makeReject(promise));
    } else {
      promise._callResolve(p, i);
    }
  }
}

function promiseObjectEach(promise, object) {
  if (!object) {
    promise._resolve({});
    return;
  }
  const keys = Object.keys(object);
  const size = keys.length;
  if (size === 0) {
    promise._resolve({});
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = {};
  while (++i < size) {
    const key = keys[i];
    const p = object[key];
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
      p.then(makeCallResolve(promise, key), makeReject(promise));
    } else {
      promise._callResolve(p, key);
    }
  }
}
