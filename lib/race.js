'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, promiseArrayEach, promiseObjectEach } = require('./internal/util');

class RaceArray extends AigleProxy {

  constructor(array) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._coll = array;
    if (size === 0) {
      this._promise._resolve();
    } else {
      promiseArrayEach(this);
    }
  }

  _callResolve(value) {
    this._promise._resolved === 0 && this._promise._resolve(value);
  }

  _callReject(reason) {
    this._promise._resolved === 0 && this._promise._reject(reason);
  }
}

class RaceObject extends AigleProxy {

  constructor(object) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._coll = object;
    if (size === 0) {
      this._promise._resolve();
    } else {
      promiseObjectEach(this);
    }
  }

  _callResolve(value) {
    this._promise._resolved === 0 && this._promise._resolve(value);
  }

  _callReject(reason) {
    this._promise._resolved === 0 && this._promise._reject(reason);
  }
}

module.exports = race;

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
  if (Array.isArray(collection)) {
    return new RaceArray(collection)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new RaceObject(collection)._promise;
  }
  return Aigle.resolve();
}
