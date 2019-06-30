'use strict';

const { Parallel } = require('./parallel');

class AllSettled extends Parallel {
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
      const map = result;
      result = map;
      map.forEach((val, key) => result.set(key, iterator(val, key)));
    } else {
      Object.entries(result).forEach(([key, val]) => (result[key] = iterator(val, key)));
    }
    _resolve.call(_promise, result);
  };
  function iterator(res, key) {
    return _errorSet.has(key)
      ? { state: 'rejected', reason: res }
      : { state: 'fulfilled', value: res };
  }
}

module.exports = { allSettled, AllSettled };

/**
 * Return an Aigle instance
 * @param {Array|Object} collection - it should be an array/object of functions or Promise instances
 * @example
 * Aigle.allSettled([
 *   Aigle.resolve(1),
 *   Aigle.reject(2),
 *   Aigle.reject(3)
 * ])
 * .then(array => {
 *   console.log(array); // [{ state: 'fulfilled', value: 1 }, { state: 'rejected', reason: 2 }, { state: 'rejected', reason: 3 }]
 * });
 */
function allSettled(collection) {
  return new AllSettled(collection)._promise;
}
