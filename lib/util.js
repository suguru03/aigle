'use strict';

exports.noop = noop;
exports.forEach = forEach;

function noop() {}

function forEach(array, iterator) {
  let index = -1;
  const size = array.length;
  while (++index < size) {
    iterator(array[index], index);
  }
}
