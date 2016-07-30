'use strict';

const util = require('./util');

module.exports = function(Promise) {

  return function all(array) {
    let size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    return new Promise(function(resolve, reject) {
      util.forEach(array, function(p, index) {
        if (p instanceof Promise) {
          p._queue.resolve(callResolve);
          p._queue.catch(reject);
          p._resume();
        } else {
          p.then(callResolve, reject);
        }
        function callResolve(value) {
          result[index] = value;
          if (--size === 0) {
            resolve(result);
          }
        }
      });
    });
  };
};
