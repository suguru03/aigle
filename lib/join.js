'use strict';

const { AigleArray } = require('aigle-core');

module.exports = join;

function join() {
  let l = arguments.length;
  const fn = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const array = Array(l);
  while (l--) {
    array[l] = arguments[l];
  }
  const promise = new AigleArray(array);
  return fn === undefined ? promise : promise.spread(fn);
}
