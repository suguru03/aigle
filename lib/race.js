'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayEach,
  promiseObjectEach,
  promiseSymbolEach,
  iteratorSymbol
} = require('./internal/util');

class Race extends AigleProxy {

  constructor(collection) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = undefined;
    this._coll = undefined;
    this._keys = undefined;
    this._result = undefined;
    if (collection === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(collection);
    }
  }

  _set(collection) {
    this._coll = collection;
    this._callResolve = callResolve;
    if (Array.isArray(collection)) {
      const size = collection.length;
      this._rest = size;
      promiseArrayEach(this);
    } else if (!collection || typeof collection !== 'object') {
      this._rest = 0;
    } else if (collection[iteratorSymbol]) {
      this._rest = collection.size;
      this._result = new Map();
      promiseSymbolEach(this);
    } else {
      const keys = Object.keys(collection);
      this._rest = keys.length;
      this._keys = keys;
      promiseObjectEach(this);
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
