'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayEach,
  promiseObjectEach,
  promiseMapEach,
  promiseSetEach,
  iteratorSymbol
} = require('./internal/util');

class Race extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._keys = undefined;
    if (coll === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(coll);
    }
  }

  _set(coll) {
    this._callResolve = callResolve;
    if (Array.isArray(coll)) {
      promiseArrayEach(this, coll.length, coll);
    } else if (!coll || typeof coll !== 'object') {
    } else if (coll[iteratorSymbol]) {
      coll instanceof Map
        ? promiseMapEach(this, Infinity, coll, new Map())
        : promiseSetEach(this, Infinity, coll);
    } else {
      const keys = Object.keys(coll);
      promiseObjectEach(this, keys.length, coll, {}, keys);
    }
    return this;
  }

  _execute() {
    return this._promise;
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { race, Race };

function callResolve(value) {
  this._promise._resolve(value);
}

/**
 * @param {Object|Array} collection
 * @example
 * Aigle.race([
 *   new Aigle(resolve => setTimeout(() => resolve(1), 30)),
 *   new Aigle(resolve => setTimeout(() => resolve(2), 20)),
 *   new Aigle(resolve => setTimeout(() => resolve(3), 10))
 * ])
 * .then(value => console.log(value)); // 3
 *
 * @example
 * Aigle.race({
 *   a: new Aigle(resolve => setTimeout(() => resolve(1), 30)),
 *   b: new Aigle(resolve => setTimeout(() => resolve(2), 20)),
 *   c: new Aigle(resolve => setTimeout(() => resolve(3), 10))
 * })
 * .then(value => console.log(value)); // 3
 */
function race(collection) {
  return new Race(collection)._promise;
}
