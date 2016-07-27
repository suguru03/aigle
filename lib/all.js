'use strict';

const util = require('./util');

module.exports = Promise => {

  return function all(array) {
    var called = 0;
    var size = array.length;
    var result = Array(size);
    if (!size) {
      return Promise.resolve(result);
    }
    return new Promise((resolve, reject) => {
      util.forEach(array, (promised, index) => {
        promised.then(value => {
          result[index] = value;
          if (++called === size) {
            resolve(result);
          }
        }, reason => {
          reject(reason);
        });
      });
    });
  };

};
