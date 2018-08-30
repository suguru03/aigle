'use strict';

const { AigleCore } = require('aigle-core');
const { version: VERSION } = require('../../package.json');
const DEFAULT_LIMIT = 8;
const errorObj = { e: undefined };
const iteratorSymbol = typeof Symbol === 'function' ? Symbol.iterator : function SYMBOL() {};
const isNode = typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]';

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
  promiseArrayEach: createPromiseArrayEach(false),
  promiseArrayEachWithFunc: createPromiseArrayEach(true),
  promiseObjectEach: createPromiseObjectEach(false),
  promiseObjectEachWithFunc: createPromiseObjectEach(true),
  promiseMapEach: createPromiseMapEach(false),
  promiseMapEachWithFunc: createPromiseMapEach(true),
  promiseSetEach: createPromiseSetEach(false),
  promiseSetEachWithFunc: createPromiseSetEach(true),
  compactArray,
  concatArray,
  clone,
  createEmptyObject,
  sortArray,
  sortObject,
  printWarning
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
  } catch (e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call1(handler, value) {
  try {
    return handler(value);
  } catch (e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call3(handler, arg1, arg2, arg3) {
  try {
    return handler(arg1, arg2, arg3);
  } catch (e) {
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
  } catch (e) {
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

function createPromiseArrayEach(withFunc) {
  return function promiseArrayEach(receiver) {
    const { _rest, _coll } = receiver;
    let i = 0;
    let promise = _coll[i];
    while (i < _rest) {
      if (promise instanceof AigleCore) {
        switch (promise._resolved) {
          case 0:
            promise._addReceiver(receiver, i);
            break;
          case 1:
            receiver._callResolve(promise._value, i);
            break;
          case 2:
            promise.suppressUnhandledRejections();
            receiver._callReject(promise._value);
            return;
        }
      } else if (promise && promise.then) {
        callProxyThen(promise, receiver, i);
      } else if (withFunc && typeof promise === 'function') {
        promise = promise();
        continue;
      } else {
        receiver._callResolve(promise, i);
      }
      promise = _coll[++i];
    }
  };
}

function createPromiseObjectEach(withFunc) {
  return function promiseObjectEach(receiver) {
    const { _rest, _keys, _coll, _result } = receiver;
    let i = 0;
    let key = _keys[i];
    let promise = _coll[key];
    while (i < _rest) {
      _result[key] = undefined;
      if (promise instanceof AigleCore) {
        switch (promise._resolved) {
          case 0:
            promise._addReceiver(receiver, key);
            break;
          case 1:
            receiver._callResolve(promise._value, key);
            break;
          case 2:
            promise.suppressUnhandledRejections();
            receiver._callReject(promise._value);
            return;
        }
      } else if (promise && promise.then) {
        callProxyThen(promise, receiver, key);
      } else if (withFunc && typeof promise === 'function') {
        promise = promise();
        continue;
      } else {
        receiver._callResolve(promise, key);
      }
      key = _keys[++i];
      promise = _coll[key];
    }
  };
}

function createPromiseSetEach(withFunc) {
  return function promiseSetEach(receiver) {
    const iter = receiver._coll[iteratorSymbol]();
    let i = -1;
    let item = iter.next();
    let promise = item.value;
    while (item.done === false) {
      if (promise instanceof AigleCore) {
        switch (promise._resolved) {
          case 0:
            promise._addReceiver(receiver, ++i);
            break;
          case 1:
            receiver._callResolve(promise._value, ++i);
            break;
          case 2:
            promise.suppressUnhandledRejections();
            receiver._callReject(promise._value);
            return;
        }
      } else if (promise && promise.then) {
        callProxyThen(promise, receiver, ++i);
      } else if (withFunc && typeof promise === 'function') {
        promise = promise();
        continue;
      } else {
        receiver._callResolve(promise, ++i);
      }
      item = iter.next();
      promise = item.value;
    }
  };
}

function createPromiseMapEach(withFunc) {
  return function promiseMapEach(receiver) {
    const { _result } = receiver;
    const iter = receiver._coll[iteratorSymbol]();
    let item = iter.next();
    let { value } = item;
    while (item.done === false) {
      const [key, promise] = value;
      _result.set(key, promise);
      if (promise instanceof AigleCore) {
        switch (promise._resolved) {
          case 0:
            promise._addReceiver(receiver, key);
            break;
          case 1:
            receiver._callResolve(promise._value, key);
            break;
          case 2:
            promise.suppressUnhandledRejections();
            receiver._callReject(promise._value);
            return;
        }
      } else if (promise && promise.then) {
        callProxyThen(promise, receiver, key);
      } else if (withFunc && typeof promise === 'function') {
        value[1] = promise();
        continue;
      } else {
        receiver._callResolve(promise, key);
      }
      item = iter.next();
      value = item.value;
    }
  };
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

function createEmptyObject(object, keys) {
  let i = -1;
  const l = keys.length;
  const result = {};
  while (++i < l) {
    result[keys[i]] = undefined;
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

function printWarning(message) {
  isNode ? console.warn(`\u001b[31m${message}\u001b[0m\n`) : console.warn(`%c${message}`, 'color: red');
}
