'use strict';

const util = require('./internal/util');
const DummyPromise = require('./internal/dummyPromise');
const errorObj = util.errorObj;
const tryCatch = util.tryCatch;

module.exports = Promise => {

  return function each(collection, iterator) {
    let size;
    let keys;
    let called = false;
    const promise = new Promise(util.noop);
    const _callResolve = promise._callResolve;
    const _callReject = promise._callReject;
    const callResolve = () => {
      if (--size === 0) {
        _callResolve();
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
      util.forEach(collection, _iterator);
    } else if (!collection) {
    } else if (typeof collection === 'object') {
      keys = Object.keys(collection);
      size = keys.length;
      util.forOwn(collection, _iterator, keys);
    }
    if (size === undefined) {
      promise._resolved = 1;
    }
    return promise;

    function _iterator(value, key) {
      const p = tryCatch(iterator, value, key);
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
      } else if (--size === 0) {
        _callResolve();
      }
    }
  };
};
