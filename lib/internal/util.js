'use strict';

const { AigleCore } = require('aigle-core');
const { version: VERSION } = require('../../package.json');
const DEFAULT_LIMIT = 8;
const errorObj = { e: undefined };
const iteratorSymbol = typeof Symbol === 'function' ? Symbol.iterator : function SYMBOL() {};

module.exports = {
  VERSION,
  DEFAULT_LIMIT,
  INTERNAL,
  PENDING,
  UNHANDLED,
  defaultIterator,
  errorObj,
  iteratorSymbol,
  call0,
  call1,
  call3,
  apply,
  callResolve,
  callReject,
  callReceiver,
  callThen,
  callProxyReciever,
  promiseArrayEach,
  promiseObjectEach,
  promiseSymbolEach,
  compactArray,
  concatArray,
  clone,
  sortArray,
  sortObject
};

function INTERNAL() {}

function PENDING() {}

function UNHANDLED() {}

function defaultIterator(n) {
  return n;
}

function call0(handler) {
  try {
    return handler();
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call1(handler, value) {
  try {
    return handler(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call3(handler, arg1, arg2, arg3) {
  try {
    return handler(arg1, arg2, arg3);
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

function callResolve(receiver, onFulfilled, value) {
  if (typeof onFulfilled !== 'function') {
    receiver._resolve(value);
    return;
  }
  const promise = call1(onFulfilled, value);
  if (promise === errorObj) {
    receiver._reject(errorObj.e);
    return;
  }
  callReceiver(receiver, promise);
}

function callReject(receiver, onRejected, reason) {
  if (typeof onRejected !== 'function') {
    receiver._reject(reason);
    return;
  }
  const promise = call1(onRejected, reason);
  if (promise === errorObj) {
    receiver._reject(errorObj.e);
    return;
  }
  callReceiver(receiver, promise);
}

function callReceiver(receiver, promise) {
  if (!promise || !promise.then) {
    receiver._resolve(promise);
    return;
  }
  if (promise instanceof AigleCore) {
    switch (promise._resolved) {
    case 0:
      promise._addReceiver(receiver, INTERNAL);
      return;
    case 1:
      receiver._resolve(promise._value);
      return;
    case 2:
      promise.suppressUnhandledRejections();
      receiver._reject(promise._value);
      return;
    }
  }
  callThen(promise, receiver);
}

function callThen(promise, receiver) {
  promise.then(resolve, reject);

  function resolve(value) {
    receiver._resolve(value);
  }

  function reject(reason) {
    receiver._reject(reason);
  }
}

function callProxyThen(promise, receiver, key) {
  promise.then(resolve, reject);

  function resolve(value) {
    receiver._callResolve(value, key);
  }

  function reject(reason) {
    receiver._callReject(reason);
  }
}

function callProxyReciever(promise, receiver, index) {
  if (promise instanceof AigleCore) {
    switch (promise._resolved) {
    case 0:
      promise._addReceiver(receiver, index);
      return true;
    case 1:
      receiver._callResolve(promise._value, index);
      return true;
    case 2:
      promise.suppressUnhandledRejections();
      receiver._callReject(promise._value);
      return false;
    }
  }
  if (promise === errorObj) {
    receiver._callReject(errorObj.e);
    return false;
  }
  if (promise && promise.then) {
    callProxyThen(promise, receiver, index);
  } else {
    receiver._callResolve(promise, index);
  }
  return true;
}

function promiseArrayEach(receiver) {
  const { _rest, _coll } = receiver;
  let i = -1;
  while (++i < _rest) {
    const promise = _coll[i];
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, i);
        continue;
      case 1:
        receiver._callResolve(promise._value, i);
        continue;
      case 2:
        promise.suppressUnhandledRejections();
        receiver._callReject(promise._value);
        return;
      }
    }
    if (promise && promise.then) {
      callProxyThen(promise, receiver, i);
    } else {
      receiver._callResolve(promise, i);
    }
  }
}

function promiseObjectEach(receiver) {
  const { _rest, _keys, _coll } = receiver;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    const promise = _coll[key];
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, key);
        continue;
      case 1:
        receiver._callResolve(promise._value, key);
        continue;
      case 2:
        promise.suppressUnhandledRejections();
        receiver._callReject(promise._value);
        return;
      }
    }
    if (promise && promise.then) {
      callProxyThen(promise, receiver, key);
    } else {
      receiver._callResolve(promise, key);
    }
  }
}

function promiseSymbolEach(receiver) {
  const { _result } = receiver;
  const iter = receiver._coll[iteratorSymbol]();
  let item;
  while ((item = iter.next()).done === false) {
    const [key, promise] = item.value;
    _result.set(key, promise);
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, key);
        continue;
      case 1:
        receiver._callResolve(promise._value, key);
        continue;
      case 2:
        promise.suppressUnhandledRejections();
        receiver._callReject(promise._value);
        return;
      }
    }
    if (promise && promise.then) {
      callProxyThen(promise, receiver, key);
    } else {
      receiver._callResolve(promise, key);
    }
  }
}

function compactArray(array) {
  let i = -1;
  const l = array.length;
  const result = [];
  while (++i < l) {
    const value = array[i];
    if (value !== INTERNAL) {
      result.push(value);
    }
  }
  return result;
}

function concatArray(array) {
  let i = -1;
  const l = array.length;
  const result = [];
  while (++i < l) {
    const value = array[i];
    if (Array.isArray(value)) {
      result.push(...value);
    } else if (value !== undefined) {
      result.push(value);
    }
  }
  return result;
}

function clone(target) {
  return Array.isArray(target) ? cloneArray(target) : cloneObject(target);
}

function cloneArray(array) {
  let l = array.length;
  const result = Array(l);
  while (l--) {
    result[l] = array[l];
  }
  return result;
}

function cloneObject(object) {
  const keys = Object.keys(object);
  let l = keys.length;
  const result = {};
  while (l--) {
    const key = keys[l];
    result[key] = object[key];
  }
  return result;
}

/**
 * @private
 * @param {Array} array
 * @param {number[]} criteria
 */
function sortArray(array, criteria) {
  const l = array.length;
  const indices = Array(l);
  for (let i = 0; i < l; i++) {
    indices[i] = i;
  }
  quickSort(criteria, 0, l - 1, indices);
  const result = Array(l);
  for (let n = 0; n < l; n++) {
    const i = indices[n];
    result[n] = i === undefined ? array[n] : array[i];
  }
  return result;
}

/**
 * @private
 * @param {Object} object
 * @param {string[]} keys
 * @param {number[]} criteria
 */
function sortObject(object, keys, criteria) {
  const l = keys.length;
  const indices = Array(l);
  for (let i = 0; i < l; i++) {
    indices[i] = i;
  }
  quickSort(criteria, 0, l - 1, indices);
  const result = Array(l);
  for (let n = 0; n < l; n++) {
    const i = indices[n];
    result[n] = object[keys[i === undefined ? n : i]];
  }
  return result;
}

function partition(array, i, j, mid, indices) {
  let l = i;
  let r = j;
  while (l <= r) {
    i = l;
    while (l < r && array[l] < mid) {
      l++;
    }
    while (r >= i && array[r] >= mid) {
      r--;
    }
    if (l > r) {
      break;
    }
    swap(array, indices, l++, r--);
  }
  return l;
}

function swap(array, indices, l, r) {
  const n = array[l];
  array[l] = array[r];
  array[r] = n;
  const i = indices[l];
  indices[l] = indices[r];
  indices[r] = i;
}

function quickSort(array, i, j, indices) {
  if (i === j) {
    return;
  }
  let k = i;
  while (++k <= j && array[i] === array[k]) {
    const l = k - 1;
    if (indices[l] > indices[k]) {
      const i = indices[l];
      indices[l] = indices[k];
      indices[k] = i;
    }
  }
  if (k > j) {
    return;
  }
  const p = array[i] > array[k] ? i : k;
  k = partition(array, i, j, array[p], indices);
  quickSort(array, i, k - 1, indices);
  quickSort(array, k, j, indices);
}

