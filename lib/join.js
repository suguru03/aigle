'use strict';

module.exports = function(Promise, PromiseArray) {

  return join;

  function join() {
    let l = arguments.length;
    const fn = typeof arguments[l - 1] === 'function' && arguments[--l];
    const array = Array(l);
    while (l--) {
      array[l] = arguments[l];
    }
    const promise = new PromiseArray(array);
    return fn ? promise.spread(fn) : promise;
  }
};
