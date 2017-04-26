'use strict';

const { AigleProxy } = require('aigle-core');

const { Aigle } = require('./aigle');
const { INTERNAL, PENDING } = require('./internal/util');
const { execute, setParallel } = require('./internal/collection');

class Each extends AigleProxy {

  constructor(iterator, collection) {
    super();
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._coll = undefined;
    this._rest = undefined;
    this._keys = undefined;
    this._result = undefined;
    this._iterate = undefined;
    if (collection === PENDING) {
      this._set = setParallel;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      setParallel.call(this, collection);
    }
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
    return this._promise;
  }

  _callResolve(value) {
    if (--this._rest === 0 || value === false) {
      this._promise._resolve();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { each, Each };

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => order.push(num));
 * };
 * Aigle.each(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => order.push(num));
 * };
 * Aigle.each(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num !== 2; // break
 *     });
 * };
 * Aigle.each(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2];
 *   });
 */
function each(collection, iterator) {
  return new Each(iterator, collection)._execute();
}
