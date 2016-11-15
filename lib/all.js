'use strict';

const { InnerReceiver } = require('./internal/receiver');
const { internal } = require('./internal/util');

module.exports = function(Promise, callResolve, callReject) {

  class PromiseArray {
    constructor(array) {
      const size = array.length;
      this.promise = new Promise(internal);
      this.rest = size;
      this.result = Array(size);
      let index = -1;
      this._callResolve = undefined;
      while (++index < size) {
        this._iterator(array[index], index);
      }
    }
    _iterator(p, index) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 0:
          p._receiver = new InnerReceiver(this, index);
          return;
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
        p.then(value => {
          this.rest--;
          this.result[index] = value;
          if (this.rest === 0) {
            callResolve(this.promise, this.result);
          }
        }, reason => callReject(this.promise, reason));
      }
      if (this.rest === 0) {
        callResolve(this.promise, this.result);
      }
    }

  }

  return function all(array) {
    if (array.length === 0) {
      return Promise.resolve([]);
    }
    return new PromiseArray(array).promise;
  };
};
