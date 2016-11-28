'use strict';

const { InnerReceiver } = require('./internal/receiver');
const { internal } = require('./internal/util');

module.exports = function(Promise, callResolve, callReject) {

  class PromiseArray {
    constructor(size) {
      this.rest = size;
      this.promise = new Promise(internal);
      this.result = Array(size);
    }
  }

  return all;

  function execute(promiseArray, array) {
    const size = array.length;
    const promise = promiseArray.promise;
    let index = -1;
    while (++index < size) {
      const p = array[index];
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 0:
          p._receiver = new InnerReceiver(promiseArray, index);
          continue;
        case 1:
          promiseArray.rest--;
          promiseArray.result[index] = p._value;
          break;
        case 2:
          callReject(promise, p._value);
          return;
        }
      } else if (!p || !p.then) {
        promiseArray.rest--;
        promiseArray.result[index] = p;
      } else {
        p.then(makeFullfilled(promiseArray, index), makeRejected(promiseArray));
        continue;
      }
      if (promiseArray.rest === 0) {
        callResolve(promise, promiseArray.result);
      }
    }
    return promise;
  }

  function makeFullfilled(promiseArray, index) {
    return value => {
      promiseArray.rest--;
      promiseArray.result[index] = value;
      if (promiseArray.rest === 0) {
        callResolve(promiseArray.promise, promiseArray.result);
      }
    };
  }

  function makeRejected(promiseArray) {
    return reason => callReject(promiseArray.promise, reason);
  }

  function all(array) {
    if (array.length === 0) {
      return Promise.resolve([]);
    }
    return execute(new PromiseArray(array.length), array);
  }
};
