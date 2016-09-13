'use strict';

const util = require('./util');

module.exports = function(Promise) {

  return function each(collection) {
    let size;
    let keys;
    const promise = new Promise(util.noop);
    const callResolve = promise._callResolve;
    let called = false;
    const callReject = error => {
      if (called) {
        return;
      }
      called = true;
      promise._callReject(error);
    };
    if (Array.isArray(collection)) {
      size = collection.length;
      util.forEach(collection, iterator);
    } else if (!collection) {
    } else if (typeof collection === 'object') {
      keys = Object.keys(collection);
      size = keys.length;
      util.forOwn(collection, iterator, keys);
    }
    if (!size) {
      promise._resolved = 1;
    }
    return promise;

    function iterator(p) {
      if (p instanceof Promise) {
        switch (p._resolved) {
        case 1:
          if (--size === 0) {
            callResolve();
          }
          return;
        case 2:
          return callReject(p._value);
        }
      }
      if (!p || !p.then) {
        if (--size === 0) {
          callResolve();
        }
        return;
      }
      p.then(() => {
        if (--size === 0) {
          callResolve();
        }
      }, callReject);
    }
  };
};
