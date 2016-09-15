'use strict';

const util = require('./internal/util');
const DummyPromise = require('./internal/dummyPromise');
const errorObj = util.errorObj;
const tryCatch = util.tryCatchWithKey;

module.exports = Promise => {

  return function eachSeries(collection, iterator) {
    let size;
    let keys;
    let _iterator;
    let index = -1;
    let called = false;
    const promise = new Promise(util.noop);
    const _callResolve = promise._callResolve;
    const _callReject = promise._callReject;
    const callResolve = () => {
      if (--size === 0) {
        _callResolve();
      } else {
        _iterator();
      }
    };
    const callReject = reason => {
      if (called) {
        return;
      }
      called = true;
      _callReject(reason);
    };
    const dummy = new DummyPromise(callResolve, callReject);

    if (Array.isArray(collection)) {
      size = collection.length;
      _iterator = () => {
        const p = tryCatch(iterator, collection[++index], index);
        if (p === errorObj) {
          this._resolved = 2;
          this._value = p.e;
          return util.callReject(promise._child, p.e);
        }
        if (p instanceof Promise) {
          p._child = dummy;
          p._resume();
          return;
        }
        if (p && p.then) {
          p.then(callResolve, callReject);
        } else {
          callResolve();
        }
      };
    } else if (!collection) {
    } else if (typeof collection === 'object') {
      keys = Object.keys(collection);
      size = keys.length;
      _iterator = () => {
        const key = keys[++index];
        const p = tryCatch(iterator, collection[key], key);
        if (p === errorObj) {
          this._resolved = 2;
          this._value = p.e;
          return util.callReject(promise._child, p.e);
        }
        if (p instanceof Promise) {
          p._child = dummy;
          p._resume();
          return;
        }
        if (p && p.then) {
          p.then(callResolve, callReject);
        } else {
          callResolve();
        }
      };
    }
    if (size === undefined) {
      promise._resolved = 1;
    } else {
      _iterator();
    }
    return promise;
  };
};
