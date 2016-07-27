'use strict';

exports.forEach = function(array, iterator) {
  var index = -1;
  var size = array.length;
  while (++index < size) {
    iterator(array[index], index);
  }
};

exports.noop = function noop() {};
exports.NativePromise = Promise;
