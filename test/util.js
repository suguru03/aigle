'use strict';

Object.assign(exports, { makeDelayTask });

function makeDelayTask(order) {
  return function delay(value, error, delay) {
    if (arguments.length === 2) {
      delay = error;
      error = null;
    }
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        order.push(value);
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      }, delay);
    });
  };
}
