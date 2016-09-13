'use strict';

exports.noop = noop;
exports.forEach = forEach;
exports.forOwn = forOwn;

function noop() {}

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
