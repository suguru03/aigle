'use strict';

const { InnerReceiver } = require('./internal/receiver');
const { internal } = require('./internal/util');

module.exports = function(Promise, callResolve, callReject) {

  class PromiseArray {
    constructor(array) {
      const size = array.length;
      this.rest = size;
      this.promise = new Promise(internal);
      this.result = Array(size);
      let index = -1;
      while (++index < size) {
        const p = array[index];
        if (p instanceof Promise) {
          switch (p._resolved) {
          case 0:
            p._receiver = new InnerReceiver(this, index);
            continue;
          case 1:
            this.rest--;
            this.result[index] = p._value;
            break;
          case 2:
            callReject(this.promise, p._value);
            return;
          }
        } else if (!p || !p.then) {
          this.rest--;
          this.result[index] = p;
        } else {
          p.then(makeFullfilled(this, index), makeRejected(this));
          continue;
        }
        if (this.rest === 0) {
          callResolve(this.promise, this.result);
        }
      }
    }
  }

  return all;

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
    return new PromiseArray(array).promise;
  }
};
