'use strict';

const { AigleProxy } = require('aigle-core');

const { Aigle } = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayEach,
  promiseObjectEach
} = require('./internal/util');

class AigleParallel extends AigleProxy {

  constructor(collection) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._result = {};
    this._rest = undefined;
    this._coll = undefined;
    this._keys = undefined;
    this._iterate = undefined;
    this._callResolve = undefined;
    if (collection === PENDING) {
      this._callResolve = set;
    } else {
      set.call(this, collection);
    }
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._keys === undefined) {
      promiseArrayEach(this);
    } else {
      promiseObjectEach(this);
    }
    return this._promise;
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { parallel, AigleParallel };

function set(collection) {
  if (Array.isArray(collection)) {
    const size = collection.length;
    this._rest = size;
    this._coll = collection;
    this._result = Array(size);
    this._iterate = promiseArrayEach;
  } else if (collection && typeof collection === 'object') {
    const keys = Object.keys(collection);
    this._rest = keys.length;
    this._coll = collection;
    this._keys = keys;
    this._result = {};
    this._iterate = promiseObjectEach;
  } else {
    this._rest = 0;
  }
  this._callResolve = callResolve;
  return this;
}

function callResolve(value, index) {
  this._result[index] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * @param {Array|Object} collection - it should be an array/object of Promise instances
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.parallel([
 *   makeDelay(1, 30),
 *   makeDelay(2, 20),
 *   makeDelay(3, 10)
 * ])
 * .then(array => {
 *   console.log(array); // [1, 2, 3]
 *   console.log(order); // [3, 2, 1]
 * });
 *
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.parallel({
 *   a: makeDelay(1, 30),
 *   b: makeDelay(2, 20),
 *   c: makeDelay(3, 10)
 * })
 * .then(object => {
 *   console.log(object); // { a: 1, b: 2, c: 3 }
 *   console.log(order); // [3, 2, 1]
 * });
 */
function parallel(collection) {
  return new AigleParallel(collection)._execute();
}
