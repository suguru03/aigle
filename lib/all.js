'use strict';

const util = require('./util');

module.exports = Promise => {

  return function all(array) {
    let size = array.length;
    const result = Array(size);
    if (size === 0) {
      return Promise.resolve(result);
    }
    return new Promise((resolve, reject) => {
      util.forEach(array, (promised, index) => {
        promised.then(value => {
          result[index] = value;
          if (--size === 0) {
            resolve(result);
          }
        }, reason => {
          reject(reason);
        });
      });
    });
  };
};
