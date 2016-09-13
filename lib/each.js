'use strict';

const util = require('./util');

module.exports = function(Promise) {

  return function each(collection, iterator) {
    let size;
    let keys;
    const promise = new Promise(util.noop);
    const _callResolve = promise._callResolve;
    let _callReject = promise._callReject;
    const callResolve = () => {
      if (--size === 0) {
        _callResolve();
      }
    };
    let callReject = reason => {
      _callReject(reason);
      _callReject = util.noop;
    };
    promise._callResolve = callResolve;
    promise._callReject = callReject;

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
      const p = iterator(value, key);
      if (p && p.then) {
        p.then(callResolve, callReject);
      } else {
        callResolve();
      }
    }
  };
};
