'use strict';

const errorObj = { e: undefined };

module.exports = {
  errorObj,
  noop,
  tryCatch,
  tryCatchWithKey,
  forEach,
  forOwn,
  times
};

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
