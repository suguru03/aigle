'use strict';

const { Parallel } = require('./parallel');

class AllSettled extends Parallel {
  constructor(coll) {
    super(coll);
  }

  _set(coll) {
    this._errorSet = new Set();
    this._promise._resolve = createResolve(this);
    super._set(coll);
  }

  _callReject(reason, key) {
    this._errorSet.add(key);
    this._callResolve(reason, key);
    return true;
  }
}

function createResolve(proxy) {
  const { _errorSet, _promise } = proxy;
  const { _resolve } = _promise;
  return result => {
    if (Array.isArray(result)) {
      result = result.map(iterator);
    } else if (result instanceof Map) {
      for (const [key, val] of result) {
        result.set(key, iterator(val, key));
      }
    } else {
      for (const [key, val] of Object.entries(result)) {
        result[key] = iterator(val, key);
      }
    }
    _resolve.call(_promise, result);
  };
  function iterator(res, key) {
    return _errorSet.has(key)
      ? {
          state: 'rejected',
          reason: res
        }
      : {
          state: 'fulfilled',
          value: res
        };
  }
}

module.exports = { allSettled, AllSettled };

/**
 */
function allSettled(array) {
  return new AllSettled(array)._promise;
}
