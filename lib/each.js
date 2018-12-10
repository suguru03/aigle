'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING } = require('./internal/util');
const { execute, setParallel } = require('./internal/collection');

class Each extends AigleProxy {
  constructor(collection, iterator, set = setDefault) {
    super();
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._coll = undefined;
    this._size = undefined;
    this._rest = undefined;
    this._keys = undefined;
    this._result = undefined;
    this._iterate = undefined;
    if (collection === PENDING) {
      this._set = set;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, collection);
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
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { each, Each };

function setDefault(collection) {
  setParallel.call(this, collection);
  this._result = collection;
  return this;
}

/**
 * `Aigle.each` iterates all elements of `collection` and execute `iterator` for each element on parallel.
 * The iterator is called with three arguments. (value, index|key, collection)
 * If the iterator returns `false` or a promise which has `false` as a result, the promise state will be `onFulfilled` immediately.
 * ⚠ All elements are already executed and can't be stopped. If you care about it, you should use [`Aigle.eachSeries`](https://suguru03.github.io/aigle/docs/global.html#eachSeries).
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 *   const order = [];
 *   const collection = [1, 4, 2];
 *   const iterator = (num, index, collection) => {
 *     return Aigle.delay(num * 10)
 *       .then(() => order.push(num));
 *   };
 *   return Aigle.each(collection, iterator)
 *     .then(value => {
 *       console.log(value); // undefined
 *       console.log(order); // [1, 2, 4];
 *     });
 *
 * @example
 *   const order = [];
 *   const collection = { a: 1, b: 4, c: 2 };
 *   const iterator = (num, key, collection) => {
 *     return Aigle.delay(num * 10)
 *       .then(() => order.push(num));
 *   };
 *   return Aigle.each(collection, iterator)
 *     .then(value => {
 *       console.log(value); // undefined
 *       console.log(order); // [1, 2, 4];
 *     });
 *
 * @example
 *    const order = [];
 *    const collection = [1, 4, 2];
 *    const iterator = (num, index, collection) => {
 *      return Aigle.delay(num * 10)
 *        .then(() => {
 *          order.push(num);
 *          return num !== 2; // break
 *        });
 *    };
 *    return Aigle.each(collection, iterator)
 *      .then(value => {
 *        console.log(value); // undefined
 *        console.log(order); // [1, 2];
 *      });
 */
function each(collection, iterator) {
  return new Each(collection, iterator)._execute();
}
