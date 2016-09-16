'use strict';

const errorObj = { e: undefined };

exports.concurrency = 8;
exports.errorObj = errorObj;
exports.noop = noop;
exports.tryCatch = tryCatch;
exports.tryCatchWithKey = tryCatchWithKey;
exports.callReject = callReject;
exports.forEach = forEach;
exports.forOwn = forOwn;
exports.times = times;

function noop() {}

function tryCatch(func, value) {
  try {
    return func(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function tryCatchWithKey(func, value, key) {
  try {
    return func(value, key);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function callReject(promise, error) {
  if (promise) {
    promise._reject(error);
  } else {
    process.emit('unhandledRejection', error);
  }
}

function forEach(array, iterator) {
  let index = -1;
  const size = array.length;
  while (++index < size) {
    iterator(array[index], index);
  }
}

function forOwn(object, iterator, keys) {
  let key;
  let index = -1;
  const size = keys.length;
  while (++index < size) {
    key = keys[index];
    iterator(object[key], key);
  }
}

function times(n, iterator) {
  let index = -1;
  while (++index < n) {
    iterator(n);
  }
}
