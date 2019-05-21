'use strict';

const { AigleCore } = require('aigle-core');
const { version: VERSION } = require('../../package.json');
const DEFAULT_LIMIT = 8;
const errorObj = { e: undefined };
const iteratorSymbol = typeof Symbol === 'function' ? Symbol.iterator : function SYMBOL() {};
const isNode =
  typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]';

const iterators = [
  createArrayIterator,
  createObjectIterator,
  createSetIterator,
  createMapIterator
].map(createIterator => [callProxyReciever, callProxyRecieverWithFunc].map(createIterator));

const [
  [, promiseArrayIterator],
  [, promiseObjectIterator],
  [, promiseSetIterator],
  [, promiseMapIterator]
] = iterators;
const [
  [promiseArrayEach, promiseArrayEachWithFunc],
  [promiseObjectEach, promiseObjectEachWithFunc],
  [promiseSetEach, promiseSetEachWithFunc],
  [promiseMapEach, promiseMapEachWithFunc]
] = [createArrayEach, createObjectEach, createSetEach, createMapEach].map((createEach, index) =>
  iterators[index].map(createEach)
);

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
  callProxyRecieverWithFunc,
  promiseArrayIterator,
  promiseArrayEach,
  promiseArrayEachWithFunc,
  promiseObjectIterator,
  promiseObjectEach,
  promiseObjectEachWithFunc,
  promiseSetIterator,
  promiseSetEach,
  promiseSetEachWithFunc,
  promiseMapIterator,
  promiseMapEach,
  promiseMapEachWithFunc,
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
  typeof onFulfilled === 'function'
    ? callReceiver(receiver, call1(onFulfilled, value))
    : receiver._resolve(value);
}

function callReject(receiver, onRejected, reason) {
  typeof onRejected === 'function'
    ? callReceiver(receiver, call1(onRejected, reason))
    : receiver._reject(reason);
}

function callReceiver(receiver, promise) {
  if (promise === errorObj) {
    receiver._reject(errorObj.e);
    return;
  }
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
    receiver._callReject(reason, key);
  }
}

function callProxyReciever(promise, receiver, key) {
  if (promise instanceof AigleCore) {
    switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, key);
        return true;
      case 1:
        receiver._callResolve(promise._value, key);
        return true;
      case 2:
        promise.suppressUnhandledRejections();
        return receiver._callReject(promise._value, key) === true;
    }
  }
  if (promise === errorObj) {
    return receiver._callReject(errorObj.e, key) === true;
  }
  if (promise && promise.then) {
    callProxyThen(promise, receiver, key);
  } else {
    receiver._callResolve(promise, key);
  }
  return true;
}

function callProxyRecieverWithFunc(promise, receiver, index) {
  if (typeof promise === 'function') {
    promise = promise();
  }
  return callProxyReciever(promise, receiver, index);
}

function createArrayIterator(handler) {
  return (receiver, coll, index) => handler(coll[index], receiver, index);
}

function createArrayEach(iterator) {
  return (receiver, times, coll) => {
    let i = -1;
    while (++i < times && iterator(receiver, coll, i)) {}
  };
}

function createObjectIterator(handler) {
  return (receiver, coll, index, result, keys) => {
    const key = keys[index];
    result[key] = undefined;
    return handler(coll[key], receiver, key);
  };
}

function createObjectEach(iterator) {
  return (receiver, times, coll, result, keys) => {
    let i = -1;
    while (++i < times && iterator(receiver, coll, i, result, keys)) {}
  };
}

function createSetIterator(handler) {
  return (receiver, iter, index) => {
    const item = iter.next();
    return item.done === false && handler(item.value, receiver, index);
  };
}

function createSetEach(iterator) {
  return (receiver, times, coll) => {
    const iter = coll[iteratorSymbol]();
    let i = -1;
    while (++i < times && iterator(receiver, iter, i)) {}
  };
}

function createMapIterator(handler) {
  return (receiver, iter, index, result) => {
    const item = iter.next();
    if (item.done) {
      return false;
    }
    const [key, promise] = item.value;
    result.set(key, undefined);
    return handler(promise, receiver, key);
  };
}

function createMapEach(iterator) {
  return (receiver, times, coll, result) => {
    const iter = coll[iteratorSymbol]();
    let i = -1;
    while (++i < times && iterator(receiver, iter, i, result)) {}
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
  isNode
    ? console.warn(`\u001b[31m${message}\u001b[0m\n`)
    : console.warn(`%c${message}`, 'color: red');
}
