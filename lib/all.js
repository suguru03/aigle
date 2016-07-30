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
      util.forEach(array, function(promised, index) {
        promised.then(function(value) {
          result[index] = value;
          if (--size === 0) {
            resolve(result);
          }
        }, function(reason) {
          reject(reason);
        });
      });
    });
  };
};
