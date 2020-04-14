(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Promise = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

require('setimmediate');
module.exports = require('./lib/aigle');

},{"./lib/aigle":2,"setimmediate":88}],2:[function(require,module,exports){
(function (process){
'use strict';

const { AigleCore, AigleProxy } = require('aigle-core');

const Queue = require('./internal/queue');
const invokeAsync = require('./internal/async');
const {
  VERSION,
  INTERNAL,
  PENDING,
  UNHANDLED,
  errorObj,
  call0,
  callResolve,
  callReject,
  callReceiver,
  printWarning,
} = require('./internal/util');
let stackTraces = false;

class Aigle extends AigleCore {
  /**
   * Create a new promise instance. It is same as native Promise.
   * It has three states, `pending`, `fulfilled` and `rejected`, the first state is `pending`.
   * The passed function has `resolve` and `reject` as the arguments,
   * if `reject` is called or an error is caused, the state goes to `rejected` and then the error is thrown to next `catch`.
   * If request is success and `resolve` is called, `then` or next task is called.
   * @param {Function} executor
   * @example
   * return new Promise((resolve, reject) => {
   *   fs.readFile('filepath', (err, data) => {
   *     if (err) {
   *       return reject(err);
   *    }
   *    resolve(data);
   *  });
   * })
   * .then(data => ...)
   * .catch(err => ...);
   */
  constructor(executor) {
    super();
    this._resolved = 0;
    this._value = undefined;
    this._key = undefined;
    this._receiver = undefined;
    this._onFulfilled = undefined;
    this._onRejected = undefined;
    this._receivers = undefined;
    if (executor === INTERNAL) {
      return;
    }
    this._execute(executor);
  }

  /**
   * @param {Function} onFulfilled
   * @param {Function} [onRejected]
   * @return {Aigle} Returns an Aigle instance
   */
  then(onFulfilled, onRejected) {
    return addAigle(this, new Aigle(INTERNAL), onFulfilled, onRejected);
  }

  /**
   * @param {Object|Function} onRejected
   * @return {Aigle} Returns an Aigle instance
   * @example
   * return Aigle.reject(new TypeError('error'))
   *   .catch(TypeError, error => console.log(error));
   */
  catch(onRejected) {
    if (arguments.length > 1) {
      let l = arguments.length;
      onRejected = arguments[--l];
      if (typeof onRejected === 'function') {
        const errorTypes = Array(l);
        while (l--) {
          errorTypes[l] = arguments[l];
        }
        onRejected = createOnRejected(errorTypes, onRejected);
      }
    }
    return addAigle(this, new Aigle(INTERNAL), undefined, onRejected);
  }

  /**
   * @param {Function} handler
   * @return {Aigle} Returns an Aigle instance
   */
  finally(handler) {
    handler = typeof handler !== 'function' ? handler : createFinallyHandler(this, handler);
    return addAigle(this, new Aigle(INTERNAL), handler, handler);
  }

  /**
   * @return {string}
   */
  toString() {
    return '[object Promise]';
  }

  /**
   * @return {boolean}
   */
  isPending() {
    return this._resolved === 0;
  }

  /**
   * @return {boolean}
   */
  isFulfilled() {
    return this._resolved === 1;
  }

  /**
   * @return {boolean}
   */
  isRejected() {
    return this._resolved === 2;
  }

  /**
   * @return {boolean}
   */
  isCancelled() {
    return this._value instanceof CancellationError;
  }

  /**
   * @return {*}
   */
  value() {
    return this._resolved === 1 ? this._value : undefined;
  }

  /**
   * @return {*}
   */
  reason() {
    return this._resolved === 2 ? this._value : undefined;
  }

  /**
   * @example
   * const { CancellationError } = Aigle;
   * let cancelled = false;
   * const promise = new Aigle((resolve, reject, onCancel) => {
   *   setTimeout(resolve, 30, 'resolved');
   *   onCancel(() => cancelled = true);
   * });
   * promise.cancel();
   * promise.catch(error => {
   *   console.log(error instanceof CancellationError); // true
   *   console.log(cancelled); // true
   * });
   */
  cancel() {
    if (this._execute === execute || this._resolved !== 0) {
      return;
    }
    const { _onCancelQueue } = this;
    if (_onCancelQueue) {
      let i = -1;
      const { array } = _onCancelQueue;
      this._onCancelQueue = undefined;
      while (++i < _onCancelQueue.length) {
        array[i]();
      }
    }
    this._resolved = 2;
    this._value = new CancellationError('late cancellation observer');
    if (this._parent) {
      this._parent.cancel();
    }
  }

  suppressUnhandledRejections() {
    this._receiver = INTERNAL;
  }

  /**
   * @param {Function} handler
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const array = [1, 2, 3];
   * Aigle.resolve(array)
   *   .spread((arg1, arg2, arg3) => {
   *     console.log(arg1, arg2, arg3); // 1, 2, 3
   *   });
   *
   * @example
   * const string = '123';
   * Aigle.resolve(string)
   *   .spread((arg1, arg2, arg3) => {
   *     console.log(arg1, arg2, arg3); // 1, 2, 3
   *   });
   */
  spread(handler) {
    return addReceiver(this, new Spread(handler));
  }

  /**
   * `Aigle#all` will execute [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all) using a previous promise value.
   * The value will be assigned as the first argument to [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all).
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const makeDelay = (num, delay) => {
   *   return Aigle.delay(delay)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve([
   *   makeDelay(1, 30),
   *   makeDelay(2, 20),
   *   makeDelay(3, 10)
   * ])
   * .all()
   * .then(array => {
   *   console.log(array); // [1, 2, 3];
   *   console.log(order); // [3, 2, 1];
   * });
   */
  all() {
    return addProxy(this, All);
  }

  allSettled() {
    return addProxy(this, AllSettled);
  }

  /**
   * @return {Aigle} Returns an Aigle instance
   * @example
   * Aigle.resolve([
   *   new Aigle(resolve => setTimeout(() => resolve(1), 30)),
   *   new Aigle(resolve => setTimeout(() => resolve(2), 20)),
   *   new Aigle(resolve => setTimeout(() => resolve(3), 10))
   * ])
   * .race()
   * .then(value => console.log(value)); // 3
   */
  race() {
    return addProxy(this, Race);
  }

  /**
   * `Aigle#props` will execute [`Aigle.props`](https://suguru03.github.io/aigle/docs/global.html#props) using a previous promise value.
   * The value will be assigned as the first argument to [`Aigle.props`](https://suguru03.github.io/aigle/docs/global.html#props).
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const makeDelay = (num, delay) => {
   *   return Aigle.delay(delay)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve({
   *   a: makeDelay(1, 30),
   *   b: makeDelay(2, 20),
   *   c: makeDelay(3, 10)
   * })
   * .props()
   * .then(object => {
   *   console.log(object); // { a: 1, b: 2, c: 3 }
   *   console.log(order); // [3, 2, 1]
   * });
   */
  props() {
    return addProxy(this, Props);
  }

  /**
   * `Aigle#parallel` will execute [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel) using a previous promise value.
   * The value will be assigned as the first argument to [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel).
   * @example
   *   Aigle.resolve([
   *     () => Aigle.delay(30, 1),
   *     Aigle.delay(20, 2),
   *     3
   *   ])
   *   .parallel()
   *   .then(array => {
   *     console.log(array); // [1, 2, 3]
   *   });
   *
   * @example
   *   Aigle.resolve({
   *     a: () => Aigle.delay(30, 1),
   *     b: Aigle.delay(20, 2),
   *     c: 3
   *   })
   *   .parallel()
   *   .then(object => {
   *     console.log(object); // { a: 1, b: 2, c: 3 }
   *   });
   */
  parallel() {
    return addProxy(this, Parallel);
  }

  /**
   * `Aigle#series` has the same functionality as [`Aigle#parallel`](https://suguru03.github.io/aigle/docs/Aigle.html#parallel)
   * and it works in series.
   * @example
   *   Aigle.resolve([
   *     () => Aigle.delay(30, 1),
   *     Aigle.delay(20, 2),
   *     3
   *   ])
   *   .series()
   *   .then(array => {
   *     console.log(array); // [1, 2, 3]
   *   });
   *
   * @example
   *   Aigle.resolve({
   *     a: () => Aigle.delay(30, 1),
   *     b: Aigle.delay(20, 2),
   *     c: 3
   *   })
   *   .series()
   *   .then(object => {
   *     console.log(object); // { a: 1, b: 2, c: 3 }
   *   });
   */
  series() {
    return addProxy(this, Series);
  }

  /**
   * `Aigle#parallelLimit` has the same functionality as [`Aigle#parallel`](https://suguru03.github.io/aigle/docs/Aigle.html#parallel)
   * and it works with concurrency.
   * @param {number} [limit=8]
   * @example
   *   Aigle.resolve([
   *     () => Aigle.delay(30, 1),
   *     Aigle.delay(20, 2),
   *     3
   *   ])
   *   .parallelLimit()
   *   .then(array => {
   *     console.log(array); // [1, 2, 3]
   *   });
   *
   * @example
   *   Aigle.resolve({
   *     a: () => Aigle.delay(30, 1),
   *     b: Aigle.delay(20, 2),
   *     c: 3
   *   })
   *   .parallelLimit(2)
   *   .then(object => {
   *     console.log(object); // { a: 1, b: 2, c: 3 }
   *   });
   */
  parallelLimit(limit) {
    return addProxy(this, ParallelLimit, limit);
  }

  /**
   * `Aigle#each` will execute [`Aigle.each`](https://suguru03.github.io/aigle/docs/global.html#each) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.each`](https://suguru03.github.io/aigle/docs/global.html#each) and
   * the iterator will be assigned as the second argument.
   * @param {Function} iterator
   * @example
   *   const order = [];
   *   const collection = [1, 4, 2];
   *   const iterator = (num, value, collection) => {
   *     return Aigle.delay(num * 10)
   *       .then(() => order.push(num));
   *   };
   *   return Aigle.resolve(collection)
   *     .each(iterator)
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
   *   return Aigle.resolve(collection)
   *     .each(iterator)
   *     .then(value => {
   *       console.log(value); // undefined
   *       console.log(order); // [1, 2, 4];
   *     });
   *
   * @example
   *   const order = [];
   *   const collection = [1, 4, 2];
   *   const iterator = (num, value, collection) => {
   *     return Aigle.delay(num * 10)
   *       .then(() => {
   *         order.push(num);
   *         return num !== 2; // break
   *       });
   *   };
   *   return Aigle.resolve(collection)
   *     .each(iterator)
   *     .then(value => {
   *       console.log(value); // undefined
   *       console.log(order); // [1, 2];
   *     });
   */
  each(iterator) {
    return addProxy(this, Each, iterator);
  }

  /**
   * @alias each
   * @param {Function} iterator
   */
  forEach(iterator) {
    return addProxy(this, Each, iterator);
  }

  /**
   * `Aigle#eachSeries` is almost the same as [`Aigle#each`](https://suguru03.github.io/aigle/docs/Aigle.html#each), but it will work in series.
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => order.push(num));
   * };
   * Aigle.resolve(collection)
   *   .eachSeries(iterator)
   *   .then(value => {
   *     console.log(value); // undefined
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, index, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => order.push(num));
   * };
   * Aigle.resolve(collection)
   *   .eachSeries(iterator)
   *   .then(value => {
   *     console.log(value); // undefined
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num !== 4; // break
   *     });
   * };
   * Aigle.resolve(collection)
   *   .eachSeries(iterator)
   *   .then(value => {
   *     console.log(value); // undefined
   *     console.log(order); // [1, 4];
   *   });
   */
  eachSeries(iterator) {
    return addProxy(this, EachSeries, iterator);
  }

  /**
   * @alias eachSeries
   * @param {Function} iterator
   */
  forEachSeries(iterator) {
    return addProxy(this, EachSeries, iterator);
  }

  /**
   * `Aigle#eachLimit` is almost the same as [`Aigle.each`](https://suguru03.github.io/aigle/docs/Aigle.html#each) and
   * [`Aigle.eachSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#eachSeries), but it will work with concurrency.
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const collection = [1, 5, 3, 4, 2];
   * return Aigle.resolve(collection)
   *   .eachLimit(2, (num, index, collection) => {
   *     return new Aigle(resolve => setTimeout(() => {
   *       console.log(num); // 1, 3, 5, 2, 4
   *       resolve(num);
   *     }, num * 10));
   *   });
   *
   * @example
   * const collection = [1, 5, 3, 4, 2];
   * return Aigle.resolve(collection)
   *   .eachLimit((num, index, collection) => {
   *     return new Aigle(resolve => setTimeout(() => {
   *       console.log(num); // 1, 2, 3, 4, 5
   *       resolve(num);
   *     }, num * 10));
   *   });
   */
  eachLimit(limit, iterator) {
    return addProxy(this, EachLimit, limit, iterator);
  }

  /**
   * @alias eachLimit
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  forEachLimit(limit, iterator) {
    return addProxy(this, EachLimit, limit, iterator);
  }

  /**
   * `Aigle#map` will execute [`Aigle.map`](https://suguru03.github.io/aigle/docs/global.html#map) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.map`](https://suguru03.github.io/aigle/docs/global.html#map) and
   * the iterator will be assigned as the second argument.
   * @param {Function|string} iterator - if you define string, you can use shorthand which is similar to lodash
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .map(iterator)
   *   .then(array => {
   *     console.log(array); // [2, 8, 4]
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .map(iterator)
   *   .then(array => {
   *     console.log(array); // [2, 8, 4]
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const collection = [{
   *  uid: 1, name: 'test1'
   * }, {
   *  uid: 4, name: 'test4'
   * }, {
   *  uid: 2, name: 'test2'
   * }];
   * Aigle.resolve(collection)
   *   .map('uid')
   *   .then(uids => console.log(uids)); // [1, 4, 2]
   *
   * @example
   * const collection = {
   *   task1: { uid: 1, name: 'test1' },
   *   task2: { uid: 4, name: 'test4' },
   *   task3: { uid: 2, name: 'test2' }
   * }];
   * Aigle.resolve(collection)
   *   .map('uid')
   *   .then(uids => console.log(uids)); // [1, 4, 2]
   */
  map(iterator) {
    return addProxy(this, Map, iterator);
  }

  /**
   * `Aigle#mapSeries` is almost the same as [`Aigle#map`](https://suguru03.github.io/aigle/docs/Aigle.html#map), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [2, 8, 4]
   *     console.log(order); // [1, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [2, 8, 4]
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  mapSeries(iterator) {
    return addProxy(this, MapSeries, iterator);
  }

  /**
   * `Aigle#mapLimit` is almost the same as [`Aigle#map`](https://suguru03.github.io/aigle/docs/Aigle.html#map)
   * and [`Aigle#mapSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#mapSeries)), but it will work with concurrency.
   * @param {integer} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [2, 10, 6, 8, 4];
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = {
   *   task1: 1,
   *   task2: 5,
   *   task3: 3,
   *   task4: 4,
   *   task5: 2
   * };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [2, 10, 6, 8, 4];
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapLimit(iterator)
   *   .then(array => {
   *     console.log(array); // [2, 10, 6, 8, 4];
   *     console.log(order); // [1, 2, 3, 4, 5];
   *   });
   */
  mapLimit(limit, iterator) {
    return addProxy(this, MapLimit, limit, iterator);
  }

  /**
   * `Aigle#mapValues` will execute [`Aigle.mapValues`](https://suguru03.github.io/aigle/docs/global.html#mapValues) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.mapValues`](https://suguru03.github.io/aigle/docs/global.html#mapValues) and
   * the iterator will be assigned as the second argument.
   * @param {Function|string} iterator - if you define string, you can use shorthand which is similar to lodash
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapValues(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 2, '1': 8, '2': 4 }
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapValues(iterator)
   *   .then(object => {
   *     console.log(object); // { a: 2, b: 8, c: 4 }
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const collection = [{
   *  uid: 1, name: 'test1'
   * }, {
   *  uid: 4, name: 'test4'
   * }, {
   *  uid: 2, name: 'test2'
   * }];
   * Aigle.resolve(collection)
   *   .mapValues('uid')
   *   .then(uids => console.log(uids)); // { '0': 1, '1': 4, '2': 2 }
   *
   * @example
   * const collection = {
   *   task1: { uid: 1, name: 'test1' },
   *   task2: { uid: 4, name: 'test4' },
   *   task3: { uid: 2, name: 'test2' }
   * }];
   * Aigle.resolve(collection)
   *   .mapValues('uid')
   *   .then(uids => console.log(uids)); // { task1: 1, task2: 4, task3: 2 }
   */
  mapValues(iterator) {
    return addProxy(this, MapValues, iterator);
  }

  /**
   * `Aigle#mapValuesSeries` is almost the same as [`Aigle#mapValues`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValues), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapValuesSeries(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 2, '1': 8, '2': 4 }
   *     console.log(order); // [1, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapValuesSeries(iterator)
   *   .then(object => {
   *     console.log(object); // { a: 2, b: 8, c: 4 }
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  mapValuesSeries(iterator) {
    return addProxy(this, MapValuesSeries, iterator);
  }

  /**
   * `Aigle#mapValuesLimit` is almost the same as [`Aigle#mapValues`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValues)
   * and [`Aigle#mapValuesSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValuesSeries)), but it will work with concurrency.
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapValuesLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 2, '1': 10, '2': 6, '3': 8, '4': 4 }
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapValuesLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { a: 2, b: 10, c: 6, d: 8, e: 4 }
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .mapValuesLimit(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 2, '1': 10, '2': 6, '3': 8, '4': 4 }
   *     console.log(order); // [1, 2, 3, 4, 5]
   *   });
   */
  mapValuesLimit(limit, iterator) {
    return addProxy(this, MapValuesLimit, limit, iterator);
  }

  /**
   * `Aigle#filter` will execute [`Aigle.filter`](https://suguru03.github.io/aigle/docs/global.html#filter) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.filter`](https://suguru03.github.io/aigle/docs/global.html#filter) and
   * the iterator will be assigned as the second argument.
   * @param {Function|Array|Object|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .filter(iterator)
   *   .then(array => {
   *     console.log(array); // [1];
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .filter(iterator)
   *   .then(array => {
   *     console.log(array); // [1];
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .filter('active')
   *   .then(array => {
   *     console.log(array); // [{ name: 'fread', active: true }]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .filter(['name', 'fread'])
   *   .then(array => {
   *     console.log(array); // [{ name: 'fread', active: true }]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .filter({ name: 'fread', active: true })
   *   .then(array => {
   *     console.log(array); // [{ name: 'fread', active: true }]
   *   });
   */
  filter(iterator) {
    return addProxy(this, Filter, iterator);
  }

  /**
   * `Aigle#filterSeries` is almost the same as [`Aigle#filter`](https://suguru03.github.io/aigle/docs/Aigle.html#filter), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .filterSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [1];
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .filterSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [1];
   *     console.log(order); // [1, 4, 2];
   *   });
   */
  filterSeries(iterator) {
    return addProxy(this, FilterSeries, iterator);
  }

  /**
   * `Aigle#filterLimit` is almost the same as [`Aigle#filter`](https://suguru03.github.io/aigle/docs/Aigle.html#filter)
   * and [`Aigle#filterSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#filterSeries)), but it will work with concurrency.
   * @param {integer} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .filterLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [1, 5, 3];
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = {
   *   task1: 1,
   *   task2: 5,
   *   task3: 3,
   *   task4: 4,
   *   task5: 2
   * };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .filterLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [1, 5, 3];
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .filterLimit(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 5, 3];
   *     console.log(order); // [1, 2, 3, 4, 5];
   *   });
   */
  filterLimit(limit, iterator) {
    return addProxy(this, FilterLimit, limit, iterator);
  }

  /**
   * @param {Function|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .reject(iterator)
   *   .then(array => {
   *     console.log(array); // [4, 2];
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .reject(iterator)
   *   .then(array => {
   *     console.log(array); // [4, 2];
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.collection(collection)
   *   .reject('active')
   *   .then(array => {
   *     console.log(array); // [{ name: 'fread', active: false }]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.collection(collection)
   *   .reject(['name', 'bargey'])
   *   .then(array => {
   *     console.log(array); // [{ name: 'fread', active: false }]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.collection(collection)
   *   .reject({ name: 'bargey', active: false })
   *   .then(array => {
   *     console.log(array); // [{ name: 'fread', active: false }]
   *   });
   */
  reject(iterator) {
    return addProxy(this, Reject, iterator);
  }

  /**
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .rejectSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [4, 2];
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .rejectSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [4, 2];
   *     console.log(order); // [1, 4, 2];
   *   });
   */
  rejectSeries(iterator) {
    return addProxy(this, RejectSeries, iterator);
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .rejectLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [4, 2]
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .rejectLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [4, 2]
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .rejectLimit(iterator)
   *   .then(array => {
   *     console.log(array); // [4, 2]
   *     console.log(order); // [1, 2, 3, 4, 5]
   *   });
   */
  rejectLimit(limit, iterator) {
    return addProxy(this, RejectLimit, limit, iterator);
  }

  /**
   * `Aigle#find` will execute [`Aigle.find`](https://suguru03.github.io/aigle/docs/global.html#find) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.find`](https://suguru03.github.io/aigle/docs/global.html#find) and
   * the iterator will be assigned as the second argument.
   * @param {Function|Array|Object|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .find(iterator)
   *   .then(value => {
   *     console.log(value); // 2
   *     console.log(order); // [1, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .find(iterator)
   *   .then(value => {
   *     console.log(value); // 2
   *     console.log(order); // [1, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return false;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .find(iterator)
   *   .then(value => {
   *     console.log(value); // undefined
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .find('active')
   *   .then(object => {
   *     console.log(object); // { name: 'fread', active: true }
   *   });
   *
   * @example
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .find(['name', 'fread'])
   *   .then(object => {
   *     console.log(object); // { name: 'fread', active: true }
   *   });
   *
   * @example
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .find({ name: 'fread', active: true })
   *   .then(object => {
   *     console.log(object); // { name: 'fread', active: true }
   *   });
   */
  find(iterator) {
    return addProxy(this, Find, iterator);
  }

  /**
   * `Aigle#findSeries` is almost the same as [`Aigle#find`](https://suguru03.github.io/aigle/docs/Aigle.html#find), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findSeries(iterator)
   *   .then(value => {
   *     console.log(value); // 4
   *     console.log(order); // [1, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findSeries(iterator)
   *   .then(value => {
   *     console.log(value); // 4
   *     console.log(order); // [1, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return false;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findSeries(iterator)
   *   .then(value => {
   *     console.log(value); // undefined
   *     console.log(order); // [1, 4, 2];
   *   });
   */
  findSeries(iterator) {
    return addProxy(this, FindSeries, iterator);
  }

  /**
   * `Aigle#findLimit` is almost the same as [`Aigle#find`](https://suguru03.github.io/aigle/docs/Aigle.html#find)
   * and [`Aigle#findSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findSeries)), but it will work with concurrency.
   * @param {integer} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findLimit(2, iterator)
   *   .then(value => {
   *     console.log(value); // 2
   *     console.log(order); // [1, 3, 5, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = {
   *   task1: 1,
   *   task2: 5,
   *   task3: 3,
   *   task4: 4,
   *   task5: 2
   * };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findLimit(2, iterator)
   *   .then(value => {
   *     console.log(value); // 2
   *     console.log(order); // [1, 3, 5, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findLimit(2, iterator)
   *   .then(value => {
   *     console.log(value); // 2
   *     console.log(order); // [1, 2];
   *   });
   */
  findLimit(limit, iterator) {
    return addProxy(this, FindLimit, limit, iterator);
  }

  /**
   * `Aigle#findIndex` will execute [`Aigle.findIndex`](https://suguru03.github.io/aigle/docs/global.html#findIndex) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.findIndex`](https://suguru03.github.io/aigle/docs/global.html#findIndex) and
   * the iterator will be assigned as the second argument.
   * @param {Function|Array|Object|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findIndex(iterator)
   *   .then(index => {
   *     console.log(index); // 2
   *     console.log(order); // [1, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return false;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findIndex(iterator)
   *   .then(index => {
   *     console.log(index); // -1
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .findIndex('active')
   *   .then(index => {
   *     console.log(index); // 1
   *   });
   *
   * @example
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .findIndex(['name', 'fread'])
   *   .then(index => {
   *     console.log(index); // 1
   *   });
   *
   * @example
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .findIndex({ name: 'fread', active: true })
   *   .then(index => {
   *     console.log(index); // 1
   *   });
   */
  findIndex(iterator) {
    return addProxy(this, FindIndex, iterator);
  }

  /**
   * `Aigle#findIndexSeries` is almost the same as [`Aigle#findIndex`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndex), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findIndexSeries(iterator)
   *   .then(index => {
   *     console.log(index); // 2
   *     console.log(order); // [1, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return false;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findIndexSeries(iterator)
   *   .then(index => {
   *     console.log(index); // -1
   *     console.log(order); // [1, 4, 2];
   *   });
   */
  findIndexSeries(iterator) {
    return addProxy(this, FindIndexSeries, iterator);
  }

  /**
   * `Aigle#findIndexLimit` is almost the same as [`Aigle#findIndex`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndex)
   * and [`Aigle#findIndexSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndexSeries)), but it will work with concurrency.
   * @param {integer} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findIndexLimit(2, iterator)
   *   .then(index => {
   *     console.log(index); // 4
   *     console.log(order); // [1, 3, 5, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .findIndexLimit(2, iterator)
   *   .then(index => {
   *     console.log(index); // 4
   *     console.log(order); // [1, 2];
   *   });
   */
  findIndexLimit(limit, iterator) {
    return addProxy(this, FindIndexLimit, limit, iterator);
  }

  /**
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   */
  findKey(iterator) {
    return addProxy(this, FindKey, iterator);
  }

  /**
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   */
  findKeySeries(iterator) {
    return addProxy(this, FindKeySeries, iterator);
  }

  /**
   * @param {integer} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   */
  findKeyLimit(limit, iterator) {
    return addProxy(this, FindKeyLimit, limit, iterator);
  }

  /**
   * @param {*} iterator
   * @param {*} [args]
   * @return {Aigle} Returns an Aigle instance
   */
  pick(iterator, ...args) {
    return addProxy(this, Pick, iterator, args);
  }

  /**
   * @alias pickBySeries
   * @param {Function} iterator
   */
  pickSeries(iterator) {
    return this.pickBySeries(iterator);
  }

  /**
   * @alias pickByLimit
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  pickLimit(limit, iterator) {
    return this.pickByLimit(limit, iterator);
  }

  /**
   * `Aigle#pickBy` will execute [`Aigle.pickBy`](https://suguru03.github.io/aigle/docs/global.html#pickBy) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.pickBy`](https://suguru03.github.io/aigle/docs/global.html#pickBy) and
   * the iterator will be assigned as the second argument.
   * @param {Function|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .pickBy(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 1 }
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .pickBy(iterator)
   *   .then(object => {
   *     console.log(object); // { a: 1 }
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .pickBy('active')
   *   .then(object => {
   *     console.log(object); // { '1': { name: 'fread', active: true } }
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .pickBy(['name', 'fread'])
   *   .then(object => {
   *     console.log(object); // { '1': { name: 'fread', active: true } }
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .pickBy({ name: 'fread', active: true })
   *   .then(object => {
   *     console.log(object); // { '1': { name: 'fread', active: true } }
   *   });
   */
  pickBy(iterator) {
    return addProxy(this, PickBy, iterator);
  }

  /**
   * `Aigle#pickBySeries` is almost the same as [`Aigle#pickBy`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBy), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .pickBySeries(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 1 }
   *     console.log(order); // [1, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num * 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .pickBySeries(iterator)
   *   .then(object => {
   *     console.log(object); // { a: 1 }
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  pickBySeries(iterator) {
    return addProxy(this, PickBySeries, iterator);
  }

  /**
   * `Aigle#pickByLimit` is almost the same as [`Aigle#pickBy`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBy)
   * and [`Aigle#pickBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBySeries)), but it will work with concurrency.
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .pickByLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 1, '1': 5, '2': 3 }
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .pickByLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { a: 1, b: 5, c: 3 }
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .pickByLimit(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 1, '1': 5, '2': 3 }
   *     console.log(order); // [1, 2, 3, 4, 5]
   *   });
   */
  pickByLimit(limit, iterator) {
    return addProxy(this, PickByLimit, limit, iterator);
  }

  /**
   * @param {*} iterator
   * @param {*} [args]
   * @return {Aigle} Returns an Aigle instance
   */
  omit(iterator, ...args) {
    return addProxy(this, Omit, iterator, args);
  }

  /**
   * @alias omitBySeries
   * @param {Function} iterator
   */
  omitSeries(iterator) {
    return this.omitBySeries(iterator);
  }

  /**
   * @alias omitByLimit
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  omitLimit(limit, iterator) {
    return this.omitByLimit(limit, iterator);
  }

  /**
   * `Aigle#omitBy` will execute [`Aigle.omitBy`](https://suguru03.github.io/aigle/docs/global.html#omitBy) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.omitBy`](https://suguru03.github.io/aigle/docs/global.html#omitBy) and
   * the iterator will be assigned as the second argument.
   * @param {Function|Array|Object|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .omitBy(iterator)
   *   .then(object => {
   *     console.log(object); // { '1': 4, '2': 4 }
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .omitBy(iterator)
   *   .then(object => {
   *     console.log(object); // { b: 4, c: 2 }
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .omitBy('active')
   *   .then(object => {
   *     console.log(object); // { '0': { name: 'bargey', active: false } }
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .omitBy(['name', 'fread'])
   *   .then(object => {
   *     console.log(object); // { '0': { name: 'bargey', active: false } }
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   name: 'bargey', active: false
   * }, {
   *   name: 'fread', active: true
   * }];
   * Aigle.resolve(collection)
   *   .omitBy({ name: 'fread', active: true })
   *   .then(object => {
   *     console.log(object); // { '0': { name: 'bargey', active: false } }
   *   });
   */
  omitBy(iterator) {
    return addProxy(this, OmitBy, iterator);
  }

  /**
   * `Aigle#omitBySeries` is almost the same as [`Aigle#omitBy`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBy), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .omitBySeries(iterator)
   *   .then(object => {
   *     console.log(object); // { '1': 4, '2': 4 }
   *     console.log(order); // [1, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .omitBySeries(iterator)
   *   .then(object => {
   *     console.log(object); // { b: 4, c: 2 }
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  omitBySeries(iterator) {
    return addProxy(this, OmitBySeries, iterator);
  }

  /**
   * `Aigle#omitByLimit` is almost the same as [`Aigle#omitBy`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBy)
   * and [`Aigle#omitBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBySeries)), but it will work with concurrency.
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .omitByLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { '3': 4, '4': 2 }
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .omitByLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { d: 4, e: 2 }
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .omitByLimit(iterator)
   *   .then(object => {
   *     console.log(object); // { '3': 4, '4': 2 }
   *     console.log(order); // [1, 2, 3, 4, 5]
   *   });
   */
  omitByLimit(limit, iterator) {
    return addProxy(this, OmitByLimit, limit, iterator);
  }

  /**
   * @param {Function} iterator
   * @param {*} result
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const collection = [1, 4, 2];
   * const iterator = (result, num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => result + num);
   * };
   * return Aigle.resolve(collection)
   *  .reduce(iterator, 1)
   *  .then(value => console.log(value)); // 8
   *
   * @example
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (result, num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => result + num);
   * };
   * return Aigle.resolve(collection)
   *   .reduce(iterator, '')
   *   .then(value => console.log(value)); // '142'
   */
  reduce(iterator, result) {
    return addProxy(this, Reduce, iterator, result);
  }

  /**
   * @param {Function} iterator
   * @param {Array|Object} [accumulator]
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (result, num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result[index] = num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transform(iterator, {})
   *   .then(object => {
   *     console.log(object); // { '0': 1, '1': 4, '2': 2 }
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (result, num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result.push(num);
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transform(iterator, {})
   *   .then(array => {
   *     console.log(array); // [1, 2, 4]
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (result, num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result.push(num);
   *       return num !== 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transform(iterator, [])
   *   .then(array => {
   *     console.log(array); // [1, 2]
   *     console.log(order); // [1, 2]
   *   });
   */
  transform(iterator, accumulator) {
    return addProxy(this, Transform, iterator, accumulator);
  }

  /**
   * @param {Function} iterator
   * @param {Array|Object} [accumulator]
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (result, num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result[index] = num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transformSeries(iterator, {})
   *   .then(object => {
   *     console.log(object); // { '0': 1, '1': 4, '2': 2 }
   *     console.log(order); // [1, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (result, num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result.push(num);
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transformSeries(iterator, {})
   *   .then(array => {
   *     console.log(array); // [1, 4, 2]
   *     console.log(order); // [1, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (result, num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result.push(num);
   *       return num !== 4;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transformSeries(iterator, [])
   *   .then(array => {
   *     console.log(array); // [1, 4]
   *     console.log(order); // [1, 4]
   *   });
   */
  transformSeries(iterator, accumulator) {
    return addProxy(this, TransformSeries, iterator, accumulator);
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @param {Array|Object} [accumulator]
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (result, num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result[index] = num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transformLimit(2, iterator, {})
   *   .then(object => {
   *     console.log(object); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
   *     console.log(order); // [1, 5, 3, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (result, num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result.push(num);
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transformLimit(2, iterator, {})
   *   .then(array => {
   *     console.log(array); // [1, 5, 3, 4, 2]
   *     console.log(order); // [1, 5, 3, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (result, num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result.push(num);
   *       return num !== 4;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transformLimit(2, iterator, [])
   *   .then(array => {
   *     console.log(array); // [1, 5, 3, 4]
   *     console.log(order); // [1, 5, 3, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (result, num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       result.push(num);
   *       return num !== 4;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .transformLimit(iterator, [])
   *   .then(array => {
   *     console.log(array); // [1, 2, 3, 4]
   *     console.log(order); // [1, 2, 3, 4]
   *   });
   */
  transformLimit(limit, iterator, accumulator) {
    return addProxy(this, TransformLimit, limit, iterator, accumulator);
  }

  /**
   * `Aigle#sortBy` will execute [`Aigle.sortBy`](https://suguru03.github.io/aigle/docs/global.html#sortBy) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.sortBy`](https://suguru03.github.io/aigle/docs/global.html#sortBy) and
   * the iterator will be assigned as the second argument.
   * @param {Function|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .sortBy(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 4]
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .sortBy(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 4]
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [{
   *   uid: 2, name: 'bargey', uid: 2
   * }, {
   *   uid: 1, name: 'fread'
   * }];
   * Aigle.resolve(collection)
   *   .sortBy('uid')
   *   .then(array => {
   *     console.log(array); // [{ uid: 1, name: 'fread' }, { uid: 2, name: 'bargey' ]
   *   });
   */
  sortBy(iterator) {
    return addProxy(this, SortBy, iterator);
  }

  /**
   * `Aigle#sortBySeries` is almost the same as [`Aigle#sortBy`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBy), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .sortBySeries(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 4]
   *     console.log(order); // [1, 4, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .sortBySeries(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 4]
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  sortBySeries(iterator) {
    return addProxy(this, SortBySeries, iterator);
  }

  /**
   * `Aigle#sortByLimit` is almost the same as [`Aigle#sortBy`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBy)
   * and [`Aigle#sortBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBySeries)), but it will work with concurrency.
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .sortByLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 3, 4, 5]
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .sortByLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 3, 4, 5]
   *     console.log(order); // [1, 3, 5, 2, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .sortByLimit(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 3, 4, 5]
   *     console.log(order); // [1, 2, 3, 4, 5]
   *   });
   */
  sortByLimit(limit, iterator) {
    return addProxy(this, SortByLimit, limit, iterator);
  }

  /**
   * `Aigle#some` will execute [`Aigle.some`](https://suguru03.github.io/aigle/docs/global.html#some) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.some`](https://suguru03.github.io/aigle/docs/global.html#some) and
   * the iterator will be assigned as the second argument.
   * @param {Function|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .some(iterator)
   *   .then(bool => {
   *     console.log(bool); // true
   *     console.log(order); // [1, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .some(iterator)
   *   .then(bool => {
   *     console.log(bool); // true
   *     console.log(order); // [1, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return false;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .some(iterator)
   *   .then(bool => {
   *     console.log(bool); // false
   *     console.log(order); // [1, 2, 4]
   *   });
   *
   * @example
   * const collection = [{
   *  uid: 1, active: false
   * }, {
   *  uid: 4, active: true
   * }, {
   *  uid: 2, active: true
   * }];
   * Aigle.resolve(collection)
   *   .some('active')
   *   .then(value => console.log(value)); // true
   *
   * @example
   * const collection = [{
   *  uid: 1, active: false
   * }, {
   *  uid: 4, active: true
   * }, {
   *  uid: 2, active: true
   * }];
   * Aigle.resolve(collection)
   *   .some(['uid', 4])
   *   .then(value => console.log(value)); // true
   *
   * @example
   * const collection = [{
   *  uid: 1, active: false
   * }, {
   *  uid: 4, active: true
   * }, {
   *  uid: 2, active: true
   * }];
   * Aigle.resolve(collection)
   *   .some({ uid: 4 })
   *   .then(value => console.log(value)); // true
   */
  some(iterator) {
    return addProxy(this, Some, iterator);
  }

  /**
   * `Aigle#someSeries` is almost the same as [`Aigle#some`](https://suguru03.github.io/aigle/docs/Aigle.html#some), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .someSeries(iterator)
   *   .then(bool => {
   *     console.log(bool); // true
   *     console.log(order); // [1, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .someSeries(iterator)
   *   .then(bool => {
   *     console.log(bool); // true
   *     console.log(order); // [1, 4]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return false;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .someSeries(iterator)
   *   .then(bool => {
   *     console.log(bool); // false
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  someSeries(iterator) {
    return addProxy(this, SomeSeries, iterator);
  }

  /**
   * `Aigle#someLimit` is almost the same as [`Aigle#some`](https://suguru03.github.io/aigle/docs/Aigle.html#some)
   * and [`Aigle#someSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#someSeries)), but it will work with concurrency.
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .someLimit(2, iterator)
   *   .then(bool => {
   *     console.log(bool); // true
   *     console.log(order); // [1, 3, 5, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .someLimit(2, iterator)
   *   .then(bool => {
   *     console.log(bool); // true
   *     console.log(order); // [1, 3, 5, 2]
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2 === 0;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .someLimit(2, iterator)
   *   .then(bool => {
   *     console.log(bool); // true
   *     console.log(order); // [1, 2]
   *   });
   */
  someLimit(limit, iterator) {
    return addProxy(this, SomeLimit, limit, iterator);
  }

  /**
   * `Aigle#every` will execute [`Aigle.every`](https://suguru03.github.io/aigle/docs/global.html#every) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.every`](https://suguru03.github.io/aigle/docs/global.html#every) and
   * the iterator will be assigned as the second argument.
   * @param {Function|Array|Object|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return true;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .every(iterator)
   *   .then(value => {
   *     console.log(value); // true
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return true;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .every(iterator)
   *   .then(value => {
   *     console.log(value); // true
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
   *       return n % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .every(iterator)
   *   .then(value => {
   *     console.log(value); // false
   *     console.log(order); // [1, 2];
   *   });
   *
   * @example
   * const collection = [{
   *  uid: 1, active: false
   * }, {
   *  uid: 4, active: true
   * }, {
   *  uid: 2, active: true
   * }];
   * Aigle.resolve(collection)
   *   .every('active')
   *   .then(value => console.log(value)); // false
   *
   * @example
   * const collection = [{
   *  uid: 1, active: false
   * }, {
   *  uid: 4, active: true
   * }, {
   *  uid: 2, active: true
   * }];
   * Aigle.resolve(collection)
   *   .every('active')
   *   .then(value => console.log(value)); // false
   *
   * @example
   * const collection = [{
   *  uid: 1, active: false
   * }, {
   *  uid: 4, active: true
   * }, {
   *  uid: 2, active: true
   * }];
   * Aigle.resolve(collection)
   *   .every(['active', true])
   *   .then(value => console.log(value)); // false
   *
   * @example
   * const collection = [{
   *  uid: 1, active: true
   * }, {
   *  uid: 4, active: true
   * }, {
   *  uid: 2, active: true
   * }];
   * Aigle.resolve(collection)
   *   .every({ active: true })
   *   .then(value => console.log(value)); // true
   */
  every(iterator) {
    return addProxy(this, Every, iterator);
  }

  /**
   * `Aigle#everySeries` is almost the same as [`Aigle#every`](https://suguru03.github.io/aigle/docs/Aigle.html#every), but it will work in series.
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return true;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .everySeries(iterator)
   *   .then(value => {
   *     console.log(value); // true
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return true;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .everySeries(iterator)
   *   .then(value => {
   *     console.log(value); // true
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return n % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .everySeries(iterator)
   *   .then(value => {
   *     console.log(value); // false
   *     console.log(order); // [1, 4];
   *   });
   */
  everySeries(iterator) {
    return addProxy(this, EverySeries, iterator);
  }

  /**
   * `Aigle#everyLimit` is almost the same as [`Aigle#every`](https://suguru03.github.io/aigle/docs/Aigle.html#every) and
   * [`Aigle#everySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#everySeries), but it will work with concurrency.
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return true;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .everyLimit(2, iterator)
   *   .then(value => {
   *     console.log(value); // true
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = {
   *   task1: 1,
   *   task2: 5,
   *   task3: 3,
   *   task4: 4,
   *   task5: 2
   * };
   * const iterator = (num, key, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return true;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .everyLimit(2, iterator)
   *   .then(value => {
   *     console.log(value); // true
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num === 4;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .everyLimit(iterator)
   *   .then(value => {
   *     console.log(value); // false
   *     console.log(order); // [1, 2, 3, 4];
   *   });
   */
  everyLimit(limit, iterator) {
    return addProxy(this, EveryLimit, limit, iterator);
  }

  /**
   * `Aigle#concat` will execute [`Aigle.concat`](https://suguru03.github.io/aigle/docs/global.html#concat) using a previous promise value and a defined iterator.
   * The value will be assigned as the first argument to [`Aigle.concat`](https://suguru03.github.io/aigle/docs/global.html#concat) and
   * the iterator will be assigned as the second argument.
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index, collectioin) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .concat(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 4];
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .concat(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 2, 4];
   *     console.log(order); // [1, 2, 4];
   *   });
   */
  concat(iterator) {
    return addProxy(this, Concat, iterator);
  }

  /**
   * `Aigle#concatSeries` is almost the same as [`Aigle#concat`](https://suguru03.github.io/aigle/docs/Aigle.html#concat), but it will work in series.
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .concatSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 4, 2];
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .concatSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 4, 2];
   *     console.log(order); // [1, 4, 2];
   *   });
   */
  concatSeries(iterator) {
    return addProxy(this, ConcatSeries, iterator);
  }

  /**
   * `Aigle#concatLimit` is almost the same as [`Aigle#concat`](https://suguru03.github.io/aigle/docs/Aigle.html#concat)
   * and [`Aigle#concatSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#concatSeries)), but it will work with concurrency.
   * @param {integer} [limit=8]
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .concatLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [1, 3, 5, 2, 4];
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = {
   *   task1: 1,
   *   task2: 5,
   *   task3: 3,
   *   task4: 4,
   *   task5: 2
   * };
   * const iterator = (num, key, collection) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .concatLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [1, 3, 5, 2, 4];
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .concatLimit(iterator)
   *   .then(array => {
   *     console.log(array); // [1, 3, 5, 2, 4];
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   */
  concatLimit(limit, iterator) {
    return addProxy(this, ConcatLimit, limit, iterator);
  }

  /**
   * @param {Function|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .groupBy(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': [2, 4], '1': [1] };
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .groupBy(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': [2, 4], '1': [1] };
   *     console.log(order); // [1, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = ['one', 'two', 'three'];
   * Aigle.resolve(collection)
   *   .groupBy('length')
   *   .then(object => {
   *     console.log(object); // { '3': ['one', 'two'], '5': ['three'] };
   *   });
   */
  groupBy(iterator) {
    return addProxy(this, GroupBy, iterator);
  }

  /**
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .groupBySeries(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': [4, 2], '1': [1] };
   *     console.log(order); // [1, 4, 2];
   *   });
   *
   * @example
   * const order = [];
   * const collection = { a: 1, b: 4, c: 2 };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .groupBySeries(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': [4, 2], '1': [1] };
   *     console.log(order); // [1, 4, 2];
   *   });
   */
  groupBySeries(iterator) {
    return addProxy(this, GroupBySeries, iterator);
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = (num, index) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .groupByLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = {
   *   task1: 1,
   *   task2: 5,
   *   task3: 3,
   *   task4: 4,
   *   task5: 2
   * };
   * const iterator = (num, key) => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .groupByLimit(2, iterator)
   *   .then(object => {
   *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
   *     console.log(order); // [1, 3, 5, 2, 4];
   *   });
   *
   * @example
   * const order = [];
   * const collection = [1, 5, 3, 4, 2];
   * const iterator = num => {
   *   return Aigle.delay(num * 10)
   *     .then(() => {
   *       order.push(num);
   *       return num % 2;
   *     });
   * };
   * Aigle.resolve(collection)
   *   .groupByLimit(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
   *     console.log(order); // [1, 2, 3, 4, 5];
   *   });
   */
  groupByLimit(limit, iterator) {
    return addProxy(this, GroupByLimit, limit, iterator);
  }

  /**
   * After a previous promise is resolved, the timer will be started with `ms`.
   * After `ms`, the delay's promise will be resolved with the previous promise value.
   * @param {number} ms
   * @example
   * Aigle.resolve()
   *   .delay(10)
   *   .then(value => console.log(value); // undefined
   *
   * @example
   * Aigle.resolve('test')
   *   .delay(10)
   *   .then(value => console.log(value); // 'test'
   */
  delay(ms) {
    return addAigle(this, new Delay(ms));
  }

  /**
   * @param {number} ms
   * @param {*} [message]
   * @example
   * const { TimeoutError } = Aigle;
   * Aigle.delay(100)
   *   .timeout(10)
   *   .catch(TimeoutError, error => {
   *     console.log(error); // operation timed out
   *   });
   */
  timeout(ms, message) {
    return addReceiver(this, new Timeout(ms, message));
  }

  /**
   * @param {Function} tester
   * @param {Function} iterator
   */
  whilst(tester, iterator) {
    return this.then((value) => whilst(value, tester, iterator));
  }

  /**
   * @param {Function} iterator
   * @param {Function} tester
   * @example
   * const order = [];
   * const tester = num => {
   *   order.push(`t:${num}`);
   *   return Aigle.delay(10)
   *     .then(() => num !== 4);
   * };
   * const iterator = count => {
   *   const num = ++count;
   *   order.push(`i:${num}`);
   *   return Aigle.delay(10)
   *     .then(() => num);
   * };
   * Aigle.resolve(0)
   *   .doWhilst(iterator, tester)
   *   .then(value => {
   *     console.log(value); // 4
   *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
   *   });
   */
  doWhilst(iterator, tester) {
    return this.then((value) => doWhilst(value, iterator, tester));
  }

  /**
   * @param {Function} tester
   * @param {Function} iterator
   */
  until(tester, iterator) {
    return this.then((value) => until(value, tester, iterator));
  }

  /**
   * @param {Function} iterator
   * @param {Function} tester
   * @example
   * const order = [];
   * const tester = num => {
   *   order.push(`t:${num}`);
   *   return Aigle.delay(10)
   *     .then(() => num === 4);
   * };
   * const iterator = count => {
   *   const num = ++count;
   *   order.push(`i:${num}`);
   *   return Aigle.delay(10)
   *     .then(() => num);
   * };
   * Aigle.resolve(0)
   *   .doUntil(iterator, tester)
   *   .then(value => {
   *     console.log(value); // 4
   *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
   *   });
   */
  doUntil(iterator, tester) {
    return this.then((value) => doUntil(value, iterator, tester));
  }

  /**
   * @param {Function} onFulfilled
   * @return {Aigle} Returns an Aigle instance
   * @example
   * Aigle.resolve(3)
   *   .thru(value => ++value)
   *   .then(value => {
   *     console.log(value); // 4;
   *   });
   */
  thru(onFulfilled) {
    return this.then((value) => thru(value, onFulfilled));
  }

  /**
   * @param {Function} onFulfilled
   * @return {Aigle} Returns an Aigle instance
   * @example
   * Aigle.resolve([1, 4, 2])
   *   .tap(array => array.pop())
   *   .then(array => {
   *     console.log(array); // [1, 4]
   *   });
   */
  tap(onFulfilled) {
    return this.then((value) => tap(value, onFulfilled));
  }

  /**
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const timer = [30, 20, 10];
   * const iterator = n => {
   *   return Aigle.delay(timer[n])
   *     .then(() => {
   *       order.push(n);
   *       return n;
   *     });
   * };
   * Aigle.resolve(3)
   *   .times(iterator)
   *   .then(array => {
   *     console.log(array); // [0, 1, 2]
   *     console.log(order); // [2, 1, 0]
   *   });
   */
  times(iterator) {
    return addProxy(this, Times, iterator);
  }

  /**
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const timer = [30, 20, 10];
   * const iterator = n => {
   *   return Aigle.delay(timer[n])
   *     .then(() => {
   *       order.push(n);
   *       return n;
   *     });
   * };
   * Aigle.resolve(3)
   *   .timesSeries(iterator)
   *   .then(array => {
   *     console.log(array); // [0, 1, 2]
   *     console.log(order); // [0, 1, 2]
   *   });
   */
  timesSeries(iterator) {
    return addProxy(this, TimesSeries, iterator);
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const timer = [30, 20, 10];
   * const iterator = n => {
   *   return Aigle.delay(timer[n])
   *     .then(() => {
   *       order.push(n);
   *       return n;
   *     });
   * };
   * Aigle.resolve(3)
   *   .timesLimit(2, iterator)
   *   .then(array => {
   *     console.log(array); // [0, 1, 2]
   *     console.log(order); // [1, 0, 2]
   *   });
   *
   * @example
   * const order = [];
   * const timer = [30, 20, 10];
   * const iterator = n => {
   *   return Aigle.delay(timer[n])
   *     .then(() => {
   *       order.push(n);
   *       return n;
   *     });
   * };
   * Aigle.resolve(3)
   *   .timesLimit(iterator)
   *   .then(array => {
   *     console.log(array); // [0, 1, 2]
   *     console.log(order); // [2, 1, 0]
   *   });
   */
  timesLimit(limit, iterator) {
    return addProxy(this, TimesLimit, limit, iterator);
  }

  /**
   * @param {Function} handler
   */
  disposer(handler) {
    return new Disposer(this, handler);
  }

  /* internal functions */

  _resolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    this._resolved = 1;
    this._value = value;
    if (this._receiver === undefined) {
      return;
    }
    this._callResolve();
  }

  _callResolve() {
    const { _receiver } = this;
    this._receiver = undefined;
    if (_receiver instanceof AigleProxy) {
      _receiver._callResolve(this._value, this._key);
    } else if (this._key === INTERNAL) {
      _receiver._resolve(this._value);
    } else {
      callResolve(_receiver, this._onFulfilled, this._value);
    }
    if (!this._receivers) {
      return;
    }
    const { _value, _key, _receivers } = this;
    this._receivers = undefined;
    let i = -1;
    const { array } = _receivers;
    while (++i < _receivers.length) {
      const { receiver, onFulfilled } = array[i];
      if (receiver instanceof AigleProxy) {
        receiver._callResolve(_value, _key);
      } else {
        callResolve(receiver, onFulfilled, _value);
      }
    }
  }

  _reject(reason) {
    if (this._resolved !== 0) {
      return;
    }
    this._resolved = 2;
    this._value = reason;
    if (this._receiver === undefined) {
      this._receiver = UNHANDLED;
      invokeAsync(this);
      return;
    }
    stackTraces && reconstructStack(this);
    this._callReject();
  }

  _callReject() {
    const { _receiver } = this;
    this._receiver = undefined;
    if (_receiver === undefined || _receiver === UNHANDLED) {
      printWarning(this._value);
      process.emit('unhandledRejection', this._value);
      return;
    }
    if (_receiver === INTERNAL) {
      return;
    }
    if (_receiver instanceof AigleProxy) {
      _receiver._callReject(this._value);
    } else if (this._key === INTERNAL) {
      _receiver._reject(this._value);
    } else {
      callReject(_receiver, this._onRejected, this._value);
    }
    if (!this._receivers) {
      return;
    }
    const { _value, _receivers } = this;
    this._receivers = undefined;
    let i = -1;
    const { array } = _receivers;
    while (++i < _receivers.length) {
      const { receiver, onRejected } = array[i];
      if (receiver instanceof AigleProxy) {
        receiver._callReject(_value);
      } else {
        callReject(receiver, onRejected, _value);
      }
    }
  }

  _addReceiver(receiver, key) {
    this._key = key;
    this._receiver = receiver;
  }
}

Aigle.prototype._execute = execute;

module.exports = Aigle;
module.exports.default = Aigle;

/* functions, classes */
const { all, All } = require('./all');
const { allSettled, AllSettled } = require('./allSettled');
const attempt = require('./attempt');
const { race, Race } = require('./race');
const { props, Props } = require('./props');
const { parallel, Parallel } = require('./parallel');
const { series, Series } = require('./series');
const { parallelLimit, ParallelLimit } = require('./parallelLimit');
const { each, Each } = require('./each');
const { eachSeries, EachSeries } = require('./eachSeries');
const { eachLimit, EachLimit } = require('./eachLimit');
const { map, Map } = require('./map');
const { mapSeries, MapSeries } = require('./mapSeries');
const { mapLimit, MapLimit } = require('./mapLimit');
const { mapValues, MapValues } = require('./mapValues');
const { mapValuesSeries, MapValuesSeries } = require('./mapValuesSeries');
const { mapValuesLimit, MapValuesLimit } = require('./mapValuesLimit');
const { filter, Filter } = require('./filter');
const { filterSeries, FilterSeries } = require('./filterSeries');
const { filterLimit, FilterLimit } = require('./filterLimit');
const { reject, Reject } = require('./reject');
const { rejectSeries, RejectSeries } = require('./rejectSeries');
const { rejectLimit, RejectLimit } = require('./rejectLimit');
const { find, Find } = require('./find');
const { findSeries, FindSeries } = require('./findSeries');
const { findLimit, FindLimit } = require('./findLimit');
const { findIndex, FindIndex } = require('./findIndex');
const { findIndexSeries, FindIndexSeries } = require('./findIndexSeries');
const { findIndexLimit, FindIndexLimit } = require('./findIndexLimit');
const { findKey, FindKey } = require('./findKey');
const { findKeySeries, FindKeySeries } = require('./findKeySeries');
const { findKeyLimit, FindKeyLimit } = require('./findKeyLimit');
const { pick, Pick } = require('./pick');
const { pickBy, PickBy } = require('./pickBy');
const { pickBySeries, PickBySeries } = require('./pickBySeries');
const { pickByLimit, PickByLimit } = require('./pickByLimit');
const { omit, Omit } = require('./omit');
const { omitBy, OmitBy } = require('./omitBy');
const { omitBySeries, OmitBySeries } = require('./omitBySeries');
const { omitByLimit, OmitByLimit } = require('./omitByLimit');
const { reduce, Reduce } = require('./reduce');
const { transform, Transform } = require('./transform');
const { transformSeries, TransformSeries } = require('./transformSeries');
const { transformLimit, TransformLimit } = require('./transformLimit');
const { sortBy, SortBy } = require('./sortBy');
const { sortBySeries, SortBySeries } = require('./sortBySeries');
const { sortByLimit, SortByLimit } = require('./sortByLimit');
const { some, Some } = require('./some');
const { someSeries, SomeSeries } = require('./someSeries');
const { someLimit, SomeLimit } = require('./someLimit');
const { every, Every } = require('./every');
const { everySeries, EverySeries } = require('./everySeries');
const { everyLimit, EveryLimit } = require('./everyLimit');
const { concat, Concat } = require('./concat');
const { concatSeries, ConcatSeries } = require('./concatSeries');
const { concatLimit, ConcatLimit } = require('./concatLimit');
const { groupBy, GroupBy } = require('./groupBy');
const { groupBySeries, GroupBySeries } = require('./groupBySeries');
const { groupByLimit, GroupByLimit } = require('./groupByLimit');
const { join, Spread } = require('./join');
const promisify = require('./promisify');
const promisifyAll = require('./promisifyAll');
const { delay, Delay } = require('./delay');
const Timeout = require('./timeout');
const { whilst } = require('./whilst');
const { doWhilst } = require('./doWhilst');
const { until } = require('./until');
const doUntil = require('./doUntil');
const retry = require('./retry');
const thru = require('./thru');
const tap = require('./tap');
const flow = require('./flow');
const { times, Times } = require('./times');
const { timesSeries, TimesSeries } = require('./timesSeries');
const { timesLimit, TimesLimit } = require('./timesLimit');
const { using, Disposer } = require('./using');
const { resolveStack, reconstructStack } = require('./debug');
const { createProxy } = require('./internal/mixin');

Aigle.VERSION = VERSION;
Aigle.Aigle = Aigle;

/* core functions */
Aigle.resolve = _resolve;
Aigle.reject = _reject;

/* collections */
Aigle.all = all;
Aigle.allSettled = allSettled;
Aigle.race = race;
Aigle.props = props;
Aigle.series = series;
Aigle.parallel = parallel;
Aigle.parallelLimit = parallelLimit;
Aigle.each = each;
Aigle.eachSeries = eachSeries;
Aigle.eachLimit = eachLimit;
Aigle.forEach = each;
Aigle.forEachSeries = eachSeries;
Aigle.forEachLimit = eachLimit;
Aigle.map = map;
Aigle.mapSeries = mapSeries;
Aigle.mapLimit = mapLimit;
Aigle.mapValues = mapValues;
Aigle.mapValuesSeries = mapValuesSeries;
Aigle.mapValuesLimit = mapValuesLimit;
Aigle.filter = filter;
Aigle.filterSeries = filterSeries;
Aigle.filterLimit = filterLimit;
Aigle.rejectSeries = rejectSeries;
Aigle.rejectLimit = rejectLimit;
Aigle.find = find;
Aigle.findSeries = findSeries;
Aigle.findLimit = findLimit;
Aigle.findIndex = findIndex;
Aigle.findIndexSeries = findIndexSeries;
Aigle.findIndexLimit = findIndexLimit;
Aigle.findKey = findKey;
Aigle.findKeySeries = findKeySeries;
Aigle.findKeyLimit = findKeyLimit;
Aigle.detect = find;
Aigle.detectSeries = findSeries;
Aigle.detectLimit = findLimit;
Aigle.pick = pick;
Aigle.pickSeries = pickBySeries;
Aigle.pickLimit = pickByLimit;
Aigle.pickBy = pickBy;
Aigle.pickBySeries = pickBySeries;
Aigle.pickByLimit = pickByLimit;
Aigle.omit = omit;
Aigle.omitSeries = omitBySeries;
Aigle.omitLimit = omitByLimit;
Aigle.omitBy = omitBy;
Aigle.omitBySeries = omitBySeries;
Aigle.omitByLimit = omitByLimit;
Aigle.reduce = reduce;
Aigle.transform = transform;
Aigle.transformSeries = transformSeries;
Aigle.transformLimit = transformLimit;
Aigle.sortBy = sortBy;
Aigle.sortBySeries = sortBySeries;
Aigle.sortByLimit = sortByLimit;
Aigle.some = some;
Aigle.someSeries = someSeries;
Aigle.someLimit = someLimit;
Aigle.every = every;
Aigle.everySeries = everySeries;
Aigle.everyLimit = everyLimit;
Aigle.concat = concat;
Aigle.concatSeries = concatSeries;
Aigle.concatLimit = concatLimit;
Aigle.groupBy = groupBy;
Aigle.groupBySeries = groupBySeries;
Aigle.groupByLimit = groupByLimit;

Aigle.attempt = attempt;
Aigle.try = attempt;
Aigle.join = join;
Aigle.promisify = promisify;
Aigle.promisifyAll = promisifyAll;
Aigle.delay = delay;
Aigle.whilst = whilst;
Aigle.doWhilst = doWhilst;
Aigle.until = until;
Aigle.doUntil = doUntil;
Aigle.retry = retry;
Aigle.thru = thru;
Aigle.tap = tap;
Aigle.flow = flow;
Aigle.times = times;
Aigle.timesSeries = timesSeries;
Aigle.timesLimit = timesLimit;
Aigle.using = using;
Aigle.mixin = mixin;

/* debug */
Aigle.config = config;
Aigle.longStackTraces = longStackTraces;

/* errors */
const { CancellationError, TimeoutError } = require('./error');
Aigle.CancellationError = CancellationError;
Aigle.TimeoutError = TimeoutError;

function _resolve(value) {
  if (value instanceof AigleCore) {
    return value;
  }
  const promise = new Aigle(INTERNAL);
  callReceiver(promise, value);
  return promise;
}

function _reject(reason, iterator) {
  if (arguments.length === 2 && typeof iterator === 'function') {
    return reject(reason, iterator);
  }
  const promise = new Aigle(INTERNAL);
  promise._reject(reason);
  return promise;
}

function execute(executor) {
  stackTraces && resolveStack(this);
  try {
    executor(
      (value) => {
        if (executor === undefined) {
          return;
        }
        executor = undefined;
        callReceiver(this, value);
      },
      (reason) => {
        if (executor === undefined) {
          return;
        }
        executor = undefined;
        this._reject(reason);
      }
    );
  } catch (e) {
    if (executor === undefined) {
      return;
    }
    executor = undefined;
    this._reject(e);
  }
}

function executeWithCancel(executor) {
  stackTraces && resolveStack(this);
  try {
    executor(
      (value) => {
        if (executor === undefined) {
          return;
        }
        if (value instanceof Aigle && value._resolved === 0) {
          this._parent = value;
        }
        executor = undefined;
        callReceiver(this, value);
      },
      (reason) => {
        if (executor === undefined) {
          return;
        }
        executor = undefined;
        this._reject(reason);
      },
      (handler) => {
        if (typeof handler !== 'function') {
          throw new TypeError('onCancel must be function');
        }
        if (this._resolved !== 0) {
          return;
        }
        if (this._onCancelQueue === undefined) {
          this._onCancelQueue = new Queue();
        }
        this._onCancelQueue.push(handler);
      }
    );
  } catch (e) {
    if (executor === undefined) {
      return;
    }
    executor = undefined;
    this._reject(e);
  }
}

function createOnRejected(errorTypes, onRejected) {
  return (reason) => {
    let l = errorTypes.length;
    while (l--) {
      const errorType = errorTypes[l];
      if (errorType === Error || errorType.prototype instanceof Error) {
        if (reason instanceof errorType) {
          return onRejected(reason);
        }
      } else if (errorType(reason)) {
        return onRejected(reason);
      }
    }
    errorObj.e = reason;
    return errorObj;
  };
}

function createFinallyHandler(promise, handler) {
  return () => {
    const { _resolved, _value } = promise;
    const p = call0(handler);
    if (p === errorObj) {
      return p;
    }
    if (p instanceof AigleCore) {
      switch (p._resolved) {
        case 1:
          p._value = _value;
          return p;
        case 2:
          return p;
      }
    }
    const receiver = new Aigle(INTERNAL);
    if (!p || !p.then) {
      receiver._resolved = _resolved;
      receiver._value = _value;
    } else if (_resolved === 1) {
      p.then(
        () => receiver._resolve(_value),
        (reason) => receiver._reject(reason)
      );
    } else {
      p.then(
        () => receiver._reject(_value),
        (reason) => receiver._reject(reason)
      );
    }
    return receiver;
  };
}

function addAigle(promise, receiver, onFulfilled, onRejected) {
  stackTraces && resolveStack(receiver);
  if (promise._receiver === undefined || promise._receiver === INTERNAL) {
    promise._resolved !== 0 && invokeAsync(promise);
    promise._receiver = receiver;
    promise._onFulfilled = onFulfilled;
    promise._onRejected = onRejected;
  } else if (promise._receiver === UNHANDLED) {
    promise._receiver = receiver;
    promise._onFulfilled = onFulfilled;
    promise._onRejected = onRejected;
  } else {
    if (!promise._receivers) {
      promise._receivers = new Queue();
    }
    promise._receivers.push({ receiver, onFulfilled, onRejected });
  }
  return receiver;
}

function addReceiver(promise, receiver) {
  stackTraces && resolveStack(receiver);
  promise._resolved !== 0 && invokeAsync(promise);
  promise._receiver = receiver;
  return receiver._promise;
}

function addProxy(promise, Proxy, arg1, arg2, arg3) {
  if (stackTraces) {
    stackTraces = false;
    const receiver = addProxy(promise, Proxy, arg1, arg2, arg3);
    stackTraces = true;
    resolveStack(receiver);
    return receiver;
  }
  switch (promise._resolved) {
    case 0:
      const receiver = new Proxy(PENDING, arg1, arg2, arg3);
      if (promise._receiver === undefined) {
        promise._receiver = receiver;
      } else {
        if (!promise._receivers) {
          promise._receivers = new Queue();
        }
        promise._receivers.push({ receiver });
      }
      return receiver._promise;
    case 1:
      return new Proxy(promise._value, arg1, arg2, arg3)._execute();
    case 2:
      return Aigle.reject(promise._value);
  }
}

/**
 * @param {Object} opts
 * @param {boolean} [opts.longStackTraces]
 * @param {boolean} [opts.cancellation]
 */
function config(opts) {
  opts = opts || {};
  if (opts.longStackTraces !== undefined) {
    stackTraces = !!opts.longStackTraces;
  }
  if (opts.cancellation !== undefined) {
    Aigle.prototype._execute = opts.cancellation ? executeWithCancel : execute;
  }
}

function longStackTraces() {
  stackTraces = true;
}

/**
 * Add functions which sources has to the Aigle class functions and static functions.
 * The functions will be converted asynchronous functions.
 * If an extended function returns a promise instance, the function will wait until the promise is resolved.
 *
 * @param {Object} sources
 * @param {Object} [opts]
 * @param {boolean} [opts.promisify=true]
 * @param {boolean} [opts.override=false]
 * @example
 * Aigle.mixin(require('lodash'));
 * const array = [1, 2, 3];
 * return Aigle.map(array, n => Aigle.delay(10, n * 2))
 *   .sum()
 *   .then(value => {
 *     console.log(value; // 12
 *   });
 *
 * @example
 * Aigle.mixin(require('lodash'));
 * const array = [1.1, 1.4, 2.2];
 * return Aigle.map(array, n => Aigle.delay(10, n * 2))
 *   .uniqBy(n => Aigle.delay(10, Math.floor(n))
 *   .then(array => {
 *     console.log(array; // [2.2, 4.4]
 *   });
 */
function mixin(sources, opts = {}) {
  const { override, promisify = true } = opts;
  Object.getOwnPropertyNames(sources).forEach((key) => {
    const func = sources[key];
    if (typeof func !== 'function' || (Aigle[key] && !override)) {
      return;
    }
    // check lodash chain
    if (key === 'chain') {
      const obj = func();
      if (obj && obj.__chain__) {
        Aigle.chain = _resolve;
        Aigle.prototype.value = function () {
          return this;
        };
        return;
      }
    }
    const Proxy = createProxy(func, promisify);
    Aigle[key] = function (value, arg1, arg2, arg3) {
      return new Proxy(value, arg1, arg2, arg3)._execute();
    };
    Aigle.prototype[key] = function (arg1, arg2, arg3) {
      return addProxy(this, Proxy, arg1, arg2, arg3);
    };
  });
  return Aigle;
}

}).call(this,require('_process'))
},{"./all":3,"./allSettled":4,"./attempt":5,"./concat":6,"./concatLimit":7,"./concatSeries":8,"./debug":9,"./delay":10,"./doUntil":11,"./doWhilst":12,"./each":13,"./eachLimit":14,"./eachSeries":15,"./error":16,"./every":17,"./everyLimit":18,"./everySeries":19,"./filter":20,"./filterLimit":21,"./filterSeries":22,"./find":23,"./findIndex":24,"./findIndexLimit":25,"./findIndexSeries":26,"./findKey":27,"./findKeyLimit":28,"./findKeySeries":29,"./findLimit":30,"./findSeries":31,"./flow":32,"./groupBy":33,"./groupByLimit":34,"./groupBySeries":35,"./internal/async":36,"./internal/mixin":38,"./internal/queue":39,"./internal/util":40,"./join":41,"./map":42,"./mapLimit":43,"./mapSeries":44,"./mapValues":45,"./mapValuesLimit":46,"./mapValuesSeries":47,"./omit":48,"./omitBy":49,"./omitByLimit":50,"./omitBySeries":51,"./parallel":52,"./parallelLimit":53,"./pick":54,"./pickBy":55,"./pickByLimit":56,"./pickBySeries":57,"./promisify":58,"./promisifyAll":59,"./props":60,"./race":61,"./reduce":62,"./reject":63,"./rejectLimit":64,"./rejectSeries":65,"./retry":66,"./series":67,"./some":68,"./someLimit":69,"./someSeries":70,"./sortBy":71,"./sortByLimit":72,"./sortBySeries":73,"./tap":74,"./thru":75,"./timeout":76,"./times":77,"./timesLimit":78,"./timesSeries":79,"./transform":80,"./transformLimit":81,"./transformSeries":82,"./until":83,"./using":84,"./whilst":85,"_process":87,"aigle-core":86}],3:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  iteratorSymbol,
  promiseArrayEach,
  promiseSetEach,
} = require('./internal/util');
const { callResolve } = require('./props');

class All extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = undefined;
    this._result = undefined;
    if (coll === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(coll);
    }
  }

  _set(coll) {
    if (Array.isArray(coll)) {
      const size = coll.length;
      this._rest = size;
      this._result = Array(size);
      this._callResolve = callResolve;
      promiseArrayEach(this, size, coll);
    } else if (coll[iteratorSymbol]) {
      const { size } = coll;
      this._rest = size;
      this._result = Array(size);
      this._callResolve = callResolve;
      promiseSetEach(this, Infinity, coll);
    } else {
      this._rest = 0;
      this._result = [];
    }
    if (this._rest === 0) {
      this._promise._resolve(this._result);
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

module.exports = { all, All };

/**
 * `Aigle.all` is almost the same functionality as `Promise.all`.
 * It will return an Aigle instance.
 * @param {Array} array
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.all([
 *   makeDelay(1, 30),
 *   makeDelay(2, 20),
 *   makeDelay(3, 10)
 * ])
 * .then(array => {
 *   console.log(array); // [1, 2, 3];
 *   console.log(order); // [3, 2, 1];
 * });
 */
function all(array) {
  return new All(array)._promise;
}

},{"./aigle":2,"./internal/util":40,"./props":60,"aigle-core":86}],4:[function(require,module,exports){
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
  return (result) => {
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

},{"./parallel":52}],5:[function(require,module,exports){
'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callResolve } = require('./internal/util');

module.exports = attempt;

/**
 * @param {function} handler
 * @return {Aigle} Returns an Aigle instance
 * @example
 * Aigle.attempt(() => {
 *     throw Error('error');
 *   })
 *   .catch(error => console.log(error)); // error
 */
function attempt(handler) {
  const receiver = new Aigle(INTERNAL);
  callResolve(receiver, handler);
  return receiver;
}

},{"./aigle":2,"./internal/util":40}],6:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { concatArray } = require('./internal/util');
const { setParallel } = require('./internal/collection');

class Concat extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(concatArray(this._result));
    }
  }
}

module.exports = { concat, Concat };

function set(collection) {
  setParallel.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
 * `Aigle.concat` has almost the same functionality as `Array#concat`.
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * The `iterator` needs to return a promise or something.
 * If a promise is returned, the function will wait until the promise is fulfilled.
 * Then the result will be assigned to an array, the role is the same as `Array#concat`.
 * All of them are finished, the function will return an array as a result.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concat(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concat(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 */
function concat(collection, iterator) {
  return new Concat(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37,"./internal/util":40}],7:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { concatArray } = require('./internal/util');
const { setLimit } = require('./internal/collection');

class ConcatLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(concatArray(this._result));
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { concatLimit, ConcatLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
 * `Aigle.concatLimit` is almost the as [`Aigle.concat`](https://suguru03.github.io/aigle/docs/Aigle.html#concat) and
 * [`Aigle.concatSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#concatSeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concatLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 3, 5, 2, 4];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = {
 *   task1: 1,
 *   task2: 5,
 *   task3: 3,
 *   task4: 4,
 *   task5: 2
 * };
 * const iterator = (num, key, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concatLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 3, 5, 2, 4];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concatLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5];
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function concatLimit(collection, limit, iterator) {
  return new ConcatLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37,"./internal/util":40}],8:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');

class ConcatSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator);
    this._result = [];
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else if (value !== undefined) {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }
}

module.exports = { concatSeries, ConcatSeries };

/**
 * `Aigle.concatSeries` is almost the as [`Aigle.concat`](https://suguru03.github.io/aigle/docs/Aigle.html#concat), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concatSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 4, 2];
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.concatSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 4, 2];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function concatSeries(collection, iterator) {
  return new ConcatSeries(collection, iterator)._execute();
}

},{"./eachSeries":15}],9:[function(require,module,exports){
'use strict';

module.exports = {
  resolveStack,
  reconstructStack,
};

function resolveStack(promise) {
  Error.captureStackTrace(promise);
}

function reconstructStack(promise) {
  const { stack, _value } = promise;
  if (_value instanceof Error === false || !stack) {
    return;
  }
  if (!_value._reconstruct) {
    _value.stack = reconstruct(_value.stack).join('\n');
    _value._reconstruct = true;
  }
  const stacks = reconstruct(stack);
  stacks[0] = '\nFrom previous event:';
  _value.stack += stacks.join('\n');
}

function reconstruct(stack) {
  const result = [];
  const stacks = stack.split('\n');
  for (let i = 0; i < stacks.length; i++) {
    const s = stacks[i];
    if (/node_modules/.test(s)) {
      continue;
    }
    result.push(s);
  }
  return result;
}

},{}],10:[function(require,module,exports){
'use strict';

const Aigle = require('./aigle');
const { INTERNAL } = require('./internal/util');

class Delay extends Aigle {
  constructor(ms) {
    super(INTERNAL);
    this._ms = ms;
    this._timer = undefined;
  }

  _resolve(value) {
    this._timer = setTimeout(() => Aigle.prototype._resolve.call(this, value), this._ms);
    return this;
  }

  _reject(reason) {
    clearTimeout(this._timer);
    Aigle.prototype._reject.call(this, reason);
  }
}

module.exports = { delay, Delay };

/**
 * Return a promise which will be resolved with `value` after `ms`.
 * @param {number} ms
 * @param {*} value
 * @return {Aigle} Returns an Aigle instance
 * @example
 * Aigle.delay(10)
 *   .then(value => console.log(value); // undefined
 *
 * @example
 * Aigle.delay(10, 'test')
 *   .then(value => console.log(value); // 'test'
 */
function delay(ms, value) {
  return new Delay(ms)._resolve(value);
}

},{"./aigle":2,"./internal/util":40}],11:[function(require,module,exports){
'use strict';

const { DoWhilst } = require('./doWhilst');
const { UntilTester } = require('./until');

module.exports = doUntil;

/**
 * @param {*} [value]
 * @param {Function} iterator
 * @param {Function} tester
 * @return {Aigle} Returns an Aigle instance
 * @example
 * let count = 0;
 * const order = [];
 * const tester = num => {
 *   order.push(`t:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num === 4);
 * };
 * const iterator = () => {
 *   const num = ++count;
 *   order.push(`i:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num);
 * };
 * Aigle.doUntil(iterator, tester)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(count); // 4
 *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
 *   });
 *
 * @example
 * const order = [];
 * const tester = num => {
 *   order.push(`t:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num === 4);
 * };
 * const iterator = count => {
 *   const num = ++count;
 *   order.push(`i:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num);
 * };
 * Aigle.doUntil(0, iterator, tester)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
 *   });
 */
function doUntil(value, iterator, tester) {
  if (typeof tester !== 'function') {
    tester = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoWhilst(new UntilTester(tester), iterator)._iterate(value);
}

},{"./doWhilst":12,"./until":83}],12:[function(require,module,exports){
'use strict';

const { AigleWhilst, WhilstTester } = require('./whilst');

class DoWhilst extends AigleWhilst {
  constructor(test, iterator) {
    super(test, iterator);
  }

  _iterate(value) {
    this._next(value);
    return this._promise;
  }
}

module.exports = { doWhilst, DoWhilst };

/**
 * @param {*} [value]
 * @param {Function} iterator
 * @param {Function} tester
 * @return {Aigle} Returns an Aigle instance
 * @example
 * let count = 0;
 * const order = [];
 * const tester = num => {
 *   order.push(`t:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num !== 4);
 * };
 * const iterator = () => {
 *   const num = ++count;
 *   order.push(`i:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num);
 * };
 * Aigle.doWhilst(iterator, tester)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(count); // 4
 *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
 *   });
 *
 * @example
 * const order = [];
 * const tester = num => {
 *   order.push(`t:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num !== 4);
 * };
 * const iterator = count => {
 *   const num = ++count;
 *   order.push(`i:${num}`);
 *   return Aigle.delay(10)
 *     .then(() => num);
 * };
 * Aigle.doWhilst(0, iterator, tester)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(order); // [ 'i:1', 't:1', 'i:2', 't:2', 'i:3', 't:3', 'i:4', 't:4' ]
 *   });
 */
function doWhilst(value, iterator, tester) {
  if (typeof tester !== 'function') {
    tester = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoWhilst(new WhilstTester(tester), iterator)._iterate(value);
}

},{"./whilst":85}],13:[function(require,module,exports){
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

},{"./aigle":2,"./internal/collection":37,"./internal/util":40,"aigle-core":86}],14:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { DEFAULT_LIMIT, INTERNAL, PENDING } = require('./internal/util');
const { execute, setLimit } = require('./internal/collection');

class EachLimit extends AigleProxy {
  constructor(collection, limit, iterator, set = setDefault) {
    super();
    if (typeof limit === 'function') {
      iterator = limit;
      limit = DEFAULT_LIMIT;
    }
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._limit = limit;
    this._coll = undefined;
    this._rest = undefined;
    this._size = undefined;
    this._keys = undefined;
    this._result = undefined;
    this._iterate = undefined;
    this._callRest = undefined;
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
      while (this._limit--) {
        this._iterate();
      }
    }
    return this._promise;
  }

  _callResolve(value) {
    if (value === false) {
      this._callRest = 0;
      this._promise._resolve(this._result);
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  }
}

module.exports = { eachLimit, EachLimit };

function setDefault(collection) {
  setLimit.call(this, collection);
  this._result = collection;
  return this;
}

/**
 * `Aigle.eachLimit` is almost same as [`Aigle.each`](https://suguru03.github.io/aigle/docs/Aigle.html#each)
 *  and [`Aigle.eachSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#eachSeries),
 *  but it will work with concurrency.
 * `limit` is concurrency, if it is not defined, concurrency is 8.
 * @param {Array|Object} A - collection to iterate over
 * @param {integer} [limit=8] - It is concurrncy, default is 8
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.eachLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = {
 *   task1: 1,
 *   task2: 5,
 *   task3: 3,
 *   task4: 4,
 *   task5: 2
 * };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.eachLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.eachLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num !== 3;
 *     });
 * };
 * Aigle.eachLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 3];
 *   });
 */
function eachLimit(collection, limit, iterator) {
  return new EachLimit(collection, limit, iterator)._execute();
}

},{"./aigle":2,"./internal/collection":37,"./internal/util":40,"aigle-core":86}],15:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING } = require('./internal/util');
const { execute, setSeries } = require('./internal/collection');

class EachSeries extends AigleProxy {
  constructor(collection, iterator, set = setDefault) {
    super();
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._coll = undefined;
    this._rest = undefined;
    this._size = undefined;
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
    } else {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { eachSeries, EachSeries };

function setDefault(collection) {
  setSeries.call(this, collection);
  this._result = collection;
  return this;
}

/**
 * `Aigle.eachSeries` is almost the same as [`Aigle.each`](https://suguru03.github.io/aigle/docs/Aigle.html#each), but it will work in series.
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
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => order.push(num));
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num !== 4; // break
 *     });
 * };
 * Aigle.eachSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4];
 *   });
 */
function eachSeries(collection, iterator) {
  return new EachSeries(collection, iterator)._execute();
}

},{"./aigle":2,"./internal/collection":37,"./internal/util":40,"aigle-core":86}],16:[function(require,module,exports){
'use strict';

const types = ['CancellationError', 'TimeoutError'];
let l = types.length;
while (l--) {
  const name = types[l];
  const Class = class extends Error {};
  Class.prototype.name = name;
  exports[name] = Class;
}

},{}],17:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { PENDING } = require('./internal/util');
const { setShorthand } = require('./internal/collection');

class Every extends Each {
  constructor(collection, iterator) {
    super(collection, iterator);
    this._result = true;
    if (collection === PENDING) {
      this._set = setShorthand;
    } else {
      setShorthand.call(this, collection);
    }
  }

  _callResolve(value) {
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    }
  }
}

module.exports = { every, Every };

/**
 * `Aigle.every` is similar to `Array#every`.
 * If all elements return truthly or a promise which has a truthly value as a result,
 * the result will be `true`, otherwise it will be `false`.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.every(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.every(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
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
 *       return n % 2;
 *     });
 * };
 * Aigle.every(collection, iterator)
 *   .then(value => {
 *     console.log(value); // false
 *     console.log(order); // [1, 2];
 *   });
 *
 * @example
 * const collection = [{
 *  uid: 1, active: false
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.every(collection, 'active')
 *   .then(value => console.log(value)); // false
 *
 * @example
 * const collection = [{
 *  uid: 1, active: false
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.every(collection, ['active', true])
 *   .then(value => console.log(value)); // false
 *
 * @example
 * const collection = [{
 *  uid: 1, active: true
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.every(collection, { active: true })
 *   .then(value => console.log(value)); // true
 */
function every(collection, iterator) {
  return new Every(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37,"./internal/util":40}],18:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');

class EveryLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator);
    this._result = true;
  }

  _callResolve(value) {
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { everyLimit, EveryLimit };

/**
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.everyLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = {
 *   task1: 1,
 *   task2: 5,
 *   task3: 3,
 *   task4: 4,
 *   task5: 2
 * };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.everyLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num === 4;
 *     });
 * };
 * Aigle.everyLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // false
 *     console.log(order); // [1, 2, 3, 4];
 *   });
 */
function everyLimit(collection, limit, iterator) {
  return new EveryLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14}],19:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries.js');

class EverySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator);
    this._result = true;
  }

  _callResolve(value) {
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    } else {
      this._iterate();
    }
  }
}

module.exports = { everySeries, EverySeries };

/**
 * `Aigle.everySeries` is almost the same as [`Aigle.every`](https://suguru03.github.io/aigle/docs/Aigle.html#every), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.everySeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key, collection) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.everySeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return n % 2;
 *     });
 * };
 * Aigle.everySeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // false
 *     console.log(order); // [1, 4];
 *   });
 */
function everySeries(collection, iterator) {
  return new EverySeries(collection, iterator)._execute();
}

},{"./eachSeries.js":15}],20:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');
const { INTERNAL, compactArray } = require('./internal/util');

class Filter extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

Filter.prototype._set = set;

module.exports = { filter, Filter };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? this._coll[index] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? this._coll[this._keys[index]] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

/**
 * `Aigle.filter` has almost the same functionality as `Array#filter`.
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * The `iterator` needs to return a promise or something.
 * If a promise is returned, the function will wait until the promise is fulfilled.
 * If the result is falsy, the element will be removed.
 * All of them are finished, the function will return an array as a result.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filter(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filter(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.filter(collection, 'active')
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: true }]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.filter(collection, ['name', 'fread'])
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: true }]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.filter(collection, { name: 'fread', active: true })
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: true }]
 *   });
 */
function filter(collection, iterator) {
  return new Filter(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37,"./internal/util":40}],21:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');
const { INTERNAL, compactArray } = require('./internal/util');

class FilterLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }
}

module.exports = { filterLimit, FilterLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? this._coll[index] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? this._coll[this._keys[index]] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.filterLimit` is almost the as [`Aigle.filter`](https://suguru03.github.io/aigle/docs/Aigle.html#filter) and
 * [`Aigle.filterSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#filterSeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filterLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 5, 3];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = {
 *   task1: 1,
 *   task2: 5,
 *   task3: 3,
 *   task4: 4,
 *   task5: 2
 * };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filterLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 5, 3];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filterLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 5, 3];
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function filterLimit(collection, limit, iterator) {
  return new FilterLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37,"./internal/util":40}],22:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');
const { INTERNAL, compactArray } = require('./internal/util');

class FilterSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { filterSeries, FilterSeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? this._coll[index] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? this._coll[this._keys[index]] : INTERNAL;
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.filterSeries` is almost the as [`Aigle.filter`](https://suguru03.github.io/aigle/docs/Aigle.html#filter), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filterSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.filterSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function filterSeries(collection, iterator) {
  return new FilterSeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37,"./internal/util":40}],23:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class Find extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { find, Find };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._size = 0;
    this._promise._resolve(this._coll[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._size = 0;
    this._promise._resolve(this._coll[this._keys[index]]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

/**
 * `Aigle.find` has almost the same functionality as `Array#find`.
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * The `iterator` needs to return a promise or something.
 * If a promise is returned, the function will wait until the promise is fulfilled.
 * If the result is truthly, the element will be returned as a result.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.find(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.find(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return false;
 *     });
 * };
 * Aigle.find(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.find(collection, 'active')
 *   .then(object => {
 *     console.log(object); // { name: 'fread', active: true }
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.find(collection, ['name', 'fread'])
 *   .then(object => {
 *     console.log(object); // { name: 'fread', active: true }
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.find(collection, { name: 'fread', active: true })
 *   .then(object => {
 *     console.log(object); // { name: 'fread', active: true }
 *   });
 */
function find(collection, iterator) {
  return new Find(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],24:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class FindIndex extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = -1;
  }

  _callResolve(value, index) {
    if (value) {
      this._size = 0;
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    }
  }
}

module.exports = { findIndex, FindIndex };

function set(collection) {
  setShorthand.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * `Aigle.findIndex` is like `Aigle.find`, it will return the index of the first element which the iterator returns truthy.
 * @param {Array} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findIndex(collection, iterator)
 *   .then(index => {
 *     console.log(index); // 2
 *     console.log(order); // [1, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return false;
 *     });
 * };
 * Aigle.findIndex(collection, iterator)
 *   .then(index => {
 *     console.log(index); // -1
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.findIndex(collection, 'active')
 *   .then(index => {
 *     console.log(index); // 1
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.findIndex(collection, ['name', 'fread'])
 *   .then(index => {
 *     console.log(index); // true
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.find(collection, { name: 'fread', active: true })
 *   .then(index => {
 *     console.log(index); // 1
 *   });
 */
function findIndex(collection, iterator) {
  return new FindIndex(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],25:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class FindIndexLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
    this._result = -1;
  }

  _callResolve(value, index) {
    if (value) {
      this._callRest = 0;
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { findIndexLimit, FindIndexLimit };

function set(collection) {
  setLimit.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * `Aigle.findIndexLimit` is almost the as [`Aigle.findIndex`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndex) and
 * [`Aigle.findIndexSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndexSeries), but it will work with concurrency.
 * @param {Array} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findIndexLimit(collection, 2, iterator)
 *   .then(index => {
 *     console.log(index); // 4
 *     console.log(order); // [1, 3, 5, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findIndexLimit(collection, iterator)
 *   .then(index => {
 *     console.log(index); // 4
 *     console.log(order); // [1, 2];
 *   });
 */
function findIndexLimit(collection, limit, iterator) {
  return new FindIndexLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37}],26:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class FindIndexSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = -1;
  }
  _callResolve(value, index) {
    if (value) {
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    } else {
      this._iterate();
    }
  }
}

module.exports = { findIndexSeries, FindIndexSeries };

function set(collection) {
  setSeries.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * `Aigle.findIndexSeries` is almost the as [`Aigle.findIndex`](https://suguru03.github.io/aigle/docs/Aigle.html#findIndex), but it will work in series.
 * @param {Array} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findIndexSeries(collection, iterator)
 *   .then(index => {
 *     console.log(index); // 1
 *     console.log(order); // [1, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return false;
 *     });
 * };
 * Aigle.findIndexSeries(collection, iterator)
 *   .then(index => {
 *     console.log(index); // -1
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function findIndexSeries(collection, iterator) {
  return new FindIndexSeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37}],27:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class FindKey extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { findKey, FindKey };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._size = 0;
    this._promise._resolve(`${index}`);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._size = 0;
    this._promise._resolve(this._keys[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findKey(collection, iterator) {
  return new FindKey(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],28:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class FindKeyLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }
}

module.exports = { findKeyLimit, FindKeyLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._callRest = 0;
    this._promise._resolve(`${index}`);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._callRest = 0;
    this._promise._resolve(this._keys[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findKeyLimit(collection, limit, iterator) {
  return new FindKeyLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37}],29:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class FindKeySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { findKeySeries, FindKeySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._promise._resolve(`${index}`);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._promise._resolve(this._keys[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else {
    this._iterate();
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findKeySeries(collection, iterator) {
  return new FindKeySeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37}],30:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class FindLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }
}

module.exports = { findLimit, FindLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._callRest = 0;
    this._promise._resolve(this._coll[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._callRest = 0;
    this._promise._resolve(this._coll[this._keys[index]]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.findLimit` is almost the as [`Aigle.find`](https://suguru03.github.io/aigle/docs/Aigle.html#find) and
 * [`Aigle.findSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#findSeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 3, 5, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findLimit(collection, 2, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 3, 5, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findLimit(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 2
 *     console.log(order); // [1, 2];
 *   });
 */
function findLimit(collection, limit, iterator) {
  return new FindLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37}],31:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class FindSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { findSeries, FindSeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._promise._resolve(this._coll[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._promise._resolve(this._coll[this._keys[index]]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.findSeries` is almost the as [`Aigle.find`](https://suguru03.github.io/aigle/docs/Aigle.html#find), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(order); // [1, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.findSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // 4
 *     console.log(order); // [1, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return false;
 *     });
 * };
 * Aigle.findSeries(collection, iterator)
 *   .then(value => {
 *     console.log(value); // undefined
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function findSeries(collection, iterator) {
  return new FindSeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37}],32:[function(require,module,exports){
'use strict';

const Aigle = require('./aigle');

module.exports = flow;

/**
 * @param {Function[]} funcs
 * @return {Function} Returns the new composite function
 * @example
 *   const add = (a, b) => Aigle.delay(10, a + b);
 *   const square = n => Aigle.delay(10, n * n);
 *   const addSquare = Aigle.flow(add, square);
 *   return addSquare(1, 2).then(value => {
 *     console.log(value); // 9
 *   });
 */
function flow(...funcs) {
  const [handler = thru, ...handlers] = flatArray(funcs);
  return (...args) =>
    Aigle.resolve(handler(...args)).then((data) =>
      Aigle.reduce(handlers, (acc, func) => func(acc), data)
    );
}

function thru(arg) {
  return arg;
}

function flatArray(args) {
  const l = args.length;
  const array = [];
  let i = -1;
  while (++i < l) {
    const arg = args[i];
    Array.isArray(arg) ? array.push(...arg) : array.push(arg);
  }
  return array;
}

},{"./aigle":2}],33:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class GroupBy extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { groupBy, GroupBy };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[index]);
  } else {
    this._result[key] = [this._coll[index]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[this._keys[index]]);
  } else {
    this._result[key] = [this._coll[this._keys[index]]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1] };
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1] };
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = ['one', 'two', 'three'];
 * Aigle.groupBy(collection, 'length')
 *   .then(object => {
 *     console.log(object); // { '3': ['one', 'two'], '5': ['three'] };
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.groupBy(collection, ['active', true])
 *   .then(object => {
 *     console.log(object);
 *     // { 'true': [{ name: 'fread', active: true }], 'false': [{ name: 'bargey', active: false }];
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.groupBy(collection, { active: true })
 *   .then(object => {
 *     console.log(object);
 *     // { 'true': [{ name: 'fread', active: true }], 'false': [{ name: 'bargey', active: false }];
 *   });
 */
function groupBy(collection, iterator) {
  return new GroupBy(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],34:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class GroupByLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
    this._result = {};
  }
}

module.exports = { groupByLimit, GroupByLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[index]);
  } else {
    this._result[key] = [this._coll[index]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[this._keys[index]]);
  } else {
    this._result[key] = [this._coll[this._keys[index]]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = {
 *   task1: 1,
 *   task2: 5,
 *   task3: 3,
 *   task4: 4,
 *   task5: 2
 * };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupByLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1, 3, 5] };
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function groupByLimit(collection, limit, iterator) {
  return new GroupByLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37}],35:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class GroupBySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { groupBySeries, GroupBySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[index]);
  } else {
    this._result[key] = [this._coll[index]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

function callResolveObject(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[this._keys[index]]);
  } else {
    this._result[key] = [this._coll[this._keys[index]]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [4, 2], '1': [1] };
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [4, 2], '1': [1] };
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function groupBySeries(collection, iterator) {
  return new GroupBySeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37}],36:[function(require,module,exports){
(function (setImmediate){
'use strict';

const queue = Array(8);
let len = 0;
let ticked = false;

function tick() {
  let i = -1;
  while (++i < len) {
    const promise = queue[i];
    queue[i] = undefined;
    switch (promise._resolved) {
      case 1:
        promise._callResolve();
        break;
      case 2:
        promise._callReject();
        break;
    }
  }
  len = 0;
  ticked = false;
}

function invoke(promise) {
  if (ticked === false) {
    setImmediate(tick);
    ticked = true;
  }
  queue[len++] = promise;
}

module.exports = invoke;

}).call(this,require("timers").setImmediate)
},{"timers":89}],37:[function(require,module,exports){
'use strict';

const { call3, callProxyReciever } = require('./util');

const [setParallel, setParallelWithOrder, setSeries] = [
  [iterateArrayParallel, iterateObjectParallel],
  [iterateArrayParallel, iterateObjectParallelWithOrder],
  [iterateArraySeries, iterateObjectSeries],
].map(createSet);

const arrayIteratorList = [
  iterateArrayParallel,
  iterateArrayWithString,
  iterateArrayWithObject,
  iterateArrayWithArray,
];
const objectIteratorList = [
  iterateObjectParallel,
  iterateObjectWithString,
  iterateObjectWithObject,
  iterateObjectWithArray,
];
const [setShorthand, setShorthandWithOrder, setPickShorthand, setOmitShorthand] = [
  [arrayIteratorList, objectIteratorList],
  [arrayIteratorList, [iterateObjectParallelWithOrder, ...objectIteratorList.slice(1)]],
  [
    [...arrayIteratorList.slice(0, 3), iteratePickWithArray],
    [...objectIteratorList.slice(0, 3), iteratePickWithArray],
  ],
  [
    [...arrayIteratorList.slice(0, 3), iterateOmitWithArray],
    [...objectIteratorList.slice(0, 3), iterateOmitWithArray],
  ],
].map(createSetShorthand);

module.exports = {
  execute,
  setParallel,
  setParallelWithOrder,
  setShorthand,
  setShorthandWithOrder,
  setPickShorthand,
  setOmitShorthand,
  setSeries,
  setLimit,
};

function execute(collection) {
  this._callResolve = this._iterate;
  this._set(collection);
  this._execute();
}

function createSet([iterateArray, iterateObject]) {
  return function set(collection) {
    if (Array.isArray(collection)) {
      this._coll = collection;
      this._size = collection.length;
      this._iterate = iterateArray;
    } else if (collection && typeof collection === 'object') {
      const keys = Object.keys(collection);
      this._coll = collection;
      this._size = keys.length;
      this._keys = keys;
      this._iterate = iterateObject;
    } else {
      this._size = 0;
    }
    this._rest = this._size;
    return this;
  };
}

function createSetShorthand(list) {
  const [getArrayIterator, getObjectIterator] = list.map(createIteratorGetter);
  return function set(collection) {
    if (Array.isArray(collection)) {
      this._coll = collection;
      this._size = collection.length;
      this._iterate = getArrayIterator(this._iterator);
    } else if (collection && typeof collection === 'object') {
      const keys = Object.keys(collection);
      this._coll = collection;
      this._size = keys.length;
      this._keys = keys;
      this._iterate = getObjectIterator(this._iterator);
    } else {
      this._size = 0;
    }
    this._rest = this._size;
    return this;
  };
}

function createIteratorGetter([
  iterateParallel,
  iterateWithString,
  iterateWithObject,
  iterateWithArray,
]) {
  return (iterator) => {
    switch (typeof iterator) {
      case 'function':
        return iterateParallel;
      case 'string':
        return iterateWithString;
      case 'object':
        return Array.isArray(iterator) ? iterateWithArray : iterateWithObject;
    }
  };
}

function setLimit(collection) {
  setSeries.call(this, collection);
  const { _limit, _size } = this;
  this._limit = _limit < _size ? _limit : _size;
  this._callRest = _size - this._limit;
  return this;
}

function iterateArrayParallel() {
  const { _rest, _iterator, _coll } = this;
  let i = -1;
  while (++i < _rest && callProxyReciever(call3(_iterator, _coll[i], i, _coll), this, i)) {}
}

function iterateObjectParallel() {
  const { _rest, _iterator, _coll, _keys } = this;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    if (callProxyReciever(call3(_iterator, _coll[key], key, _coll), this, i) === false) {
      break;
    }
  }
}
function iterateObjectParallelWithOrder() {
  const { _rest, _iterator, _coll, _keys, _result } = this;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    _result[key] = undefined;
    if (callProxyReciever(call3(_iterator, _coll[key], key, _coll), this, i) === false) {
      break;
    }
  }
}

function iterateArraySeries() {
  const { _coll } = this;
  const i = this._index++;
  callProxyReciever(call3(this._iterator, _coll[i], i, _coll), this, i);
}

function iterateObjectSeries() {
  const { _coll } = this;
  const i = this._index++;
  const key = this._keys[i];
  callProxyReciever(call3(this._iterator, _coll[key], key, _coll), this, i);
}

function iterateArrayWithString() {
  const { _iterator, _coll } = this;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[i];
    if (obj) {
      this._callResolve(obj[_iterator], i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateObjectWithString() {
  const { _iterator, _coll, _keys } = this;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[_keys[i]];
    if (obj) {
      this._callResolve(obj[_iterator], i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateArrayWithArray() {
  const { _coll } = this;
  const [key, value] = this._iterator;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[i];
    if (obj) {
      this._callResolve(obj[key] === value, i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateObjectWithArray() {
  const { _coll, _keys } = this;
  const [key, value] = this._iterator;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[_keys[i]];
    if (obj) {
      this._callResolve(obj[key] === value, i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateArrayWithObject() {
  const { _iterator: object, _coll } = this;
  const keys = Object.keys(object);
  let i = -1;
  first: while (++i < this._size) {
    const obj = _coll[i];
    if (!obj) {
      this._callResolve(undefined, i);
      continue;
    }
    let l = keys.length;
    while (l--) {
      const key = keys[l];
      if (obj[key] !== object[key]) {
        this._callResolve(false, i);
        continue first;
      }
    }
    this._callResolve(true, i);
  }
}

function iterateObjectWithObject() {
  const { _iterator: object, _coll, _keys } = this;
  const keys = Object.keys(object);
  let i = -1;
  first: while (++i < this._size) {
    const obj = _coll[_keys[i]];
    if (!obj) {
      this._callResolve(undefined, i);
      continue;
    }
    let l = keys.length;
    while (l--) {
      const key = keys[l];
      if (obj[key] !== object[key]) {
        this._callResolve(false, i);
        continue first;
      }
    }
    this._callResolve(true, i);
  }
}

function iteratePickWithArray() {
  const { _coll, _result } = this;
  pick(this._iterator);
  this._promise._resolve(_result);

  function pick(array) {
    let i = -1;
    while (++i < array.length) {
      const key = array[i];
      if (Array.isArray(key)) {
        pick(key);
        continue;
      }
      if (_coll.hasOwnProperty(key)) {
        _result[key] = _coll[key];
      }
    }
  }
}

function iterateOmitWithArray() {
  const { _coll, _result } = this;
  const map = {};
  createMap(this._iterator);
  Object.keys(_coll).forEach((key) => {
    if (map.hasOwnProperty(key) === false) {
      _result[key] = _coll[key];
    }
  });
  this._promise._resolve(_result);

  function createMap(array) {
    let i = -1;
    while (++i < array.length) {
      const key = array[i];
      if (Array.isArray(key)) {
        createMap(key);
        continue;
      }
      map[key] = true;
    }
  }
}

},{"./util":40}],38:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('../aigle');
const { map } = require('../map');
const { mapValues } = require('../mapValues');
const { INTERNAL, PENDING, apply, callProxyReciever } = require('./util');

module.exports = { createProxy };

class MixinProxy extends AigleProxy {
  constructor(func, exec, args) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._func = func;
    this._args = args;
    this._execute = exec;
    if (args[0] === PENDING) {
      this._set = this._callResolve;
      this._callResolve = exec;
    }
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

function execute(value) {
  const { _args } = this;
  if (_args[0] === PENDING) {
    _args[0] = value;
    this._callResolve = this._set;
  }
  callProxyReciever(apply(this._func, _args), this);
  return this._promise;
}

function executeWithPromisify(value) {
  const { _args } = this;
  if (_args[0] === PENDING) {
    _args[0] = value;
    this._callResolve = this._set;
  } else {
    value = _args[0];
  }
  const iterator = _args[1];
  const isFunc = typeof iterator === 'function';
  if (isFunc && Array.isArray(value)) {
    callIterator(this, map, (array) => {
      let index = 0;
      _args[1] = () => array[index++];
      callProxyReciever(apply(this._func, _args), this);
    });
  } else if (isFunc && value && typeof value === 'object') {
    callIterator(this, mapValues, (object) => {
      let index = 0;
      const keys = Object.keys(object);
      _args[1] = () => object[keys[index++]];
      callProxyReciever(apply(this._func, _args), this);
    });
  } else {
    callProxyReciever(apply(this._func, _args), this);
  }
  return this._promise;
}

function callIterator(proxy, func, onFulfilled) {
  const [collection, iterator] = proxy._args;
  const p = func(collection, (value, key) => iterator(value, key, collection));
  return p._resolved === 1
    ? onFulfilled(p._value)
    : p.then(onFulfilled, (error) => proxy._callReject(error));
}

/**
 * @private
 * @param {function} func
 * @param {boolean} promisify
 */
function createProxy(func, promisify) {
  const exec = promisify ? executeWithPromisify : execute;
  return class extends MixinProxy {
    constructor(...args) {
      super(func, exec, args);
    }
  };
}

},{"../aigle":2,"../map":42,"../mapValues":45,"./util":40,"aigle-core":86}],39:[function(require,module,exports){
'use strict';

class Queue {
  constructor(size = 8) {
    this.array = Array(size);
    this.length = 0;
  }

  push(task) {
    this.array[this.length++] = task;
  }
}

module.exports = Queue;

},{}],40:[function(require,module,exports){
(function (process){
'use strict';

const { AigleCore } = require('aigle-core');
const { version: VERSION } = require('../../package.json');
const DEFAULT_LIMIT = 8;
const errorObj = { e: undefined };
const iteratorSymbol = typeof Symbol === 'function' ? Symbol.iterator : function SYMBOL() {};
const isNode =
  typeof process === 'object' && Object.prototype.toString.call(process) === '[object process]';

const iterators = [
  createArrayIterator,
  createObjectIterator,
  createSetIterator,
  createMapIterator,
].map((createIterator) => [callProxyReciever, callProxyRecieverWithFunc].map(createIterator));

const [
  [, promiseArrayIterator],
  [, promiseObjectIterator],
  [, promiseSetIterator],
  [, promiseMapIterator],
] = iterators;
const [
  [promiseArrayEach, promiseArrayEachWithFunc],
  [promiseObjectEach, promiseObjectEachWithFunc],
  [promiseSetEach, promiseSetEachWithFunc],
  [promiseMapEach, promiseMapEachWithFunc],
] = [createArrayEach, createObjectEach, createSetEach, createMapEach].map((createEach, index) =>
  iterators[index].map(createEach)
);

module.exports = {
  VERSION,
  DEFAULT_LIMIT,
  INTERNAL,
  PENDING,
  UNHANDLED,
  defaultIterator,
  errorObj,
  iteratorSymbol,
  call0,
  call1,
  call3,
  apply,
  callResolve,
  callReject,
  callReceiver,
  callThen,
  callProxyReciever,
  callProxyRecieverWithFunc,
  promiseArrayIterator,
  promiseArrayEach,
  promiseArrayEachWithFunc,
  promiseObjectIterator,
  promiseObjectEach,
  promiseObjectEachWithFunc,
  promiseSetIterator,
  promiseSetEach,
  promiseSetEachWithFunc,
  promiseMapIterator,
  promiseMapEach,
  promiseMapEachWithFunc,
  compactArray,
  concatArray,
  clone,
  createEmptyObject,
  sortArray,
  sortObject,
  printWarning,
};

function INTERNAL() {}

function PENDING() {}

function UNHANDLED() {}

function defaultIterator(n) {
  return n;
}

function call0(handler) {
  try {
    return handler();
  } catch (e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call1(handler, value) {
  try {
    return handler(value);
  } catch (e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call3(handler, arg1, arg2, arg3) {
  try {
    return handler(arg1, arg2, arg3);
  } catch (e) {
    errorObj.e = e;
    return errorObj;
  }
}

function apply(handler, array) {
  try {
    switch (array.length) {
      case 0:
        return handler();
      case 1:
        return handler(array[0]);
      case 2:
        return handler(array[0], array[1]);
      case 3:
        return handler(array[0], array[1], array[2]);
      default:
        return handler.apply(null, array);
    }
  } catch (e) {
    errorObj.e = e;
    return errorObj;
  }
}

function callResolve(receiver, onFulfilled, value) {
  typeof onFulfilled === 'function'
    ? callReceiver(receiver, call1(onFulfilled, value))
    : receiver._resolve(value);
}

function callReject(receiver, onRejected, reason) {
  typeof onRejected === 'function'
    ? callReceiver(receiver, call1(onRejected, reason))
    : receiver._reject(reason);
}

function callReceiver(receiver, promise) {
  if (promise === errorObj) {
    receiver._reject(errorObj.e);
    return;
  }
  if (!promise || !promise.then) {
    receiver._resolve(promise);
    return;
  }
  if (promise instanceof AigleCore) {
    switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, INTERNAL);
        return;
      case 1:
        receiver._resolve(promise._value);
        return;
      case 2:
        promise.suppressUnhandledRejections();
        receiver._reject(promise._value);
        return;
    }
  }
  callThen(promise, receiver);
}

function callThen(promise, receiver) {
  promise.then(resolve, reject);

  function resolve(value) {
    receiver._resolve(value);
  }

  function reject(reason) {
    receiver._reject(reason);
  }
}

function callProxyThen(promise, receiver, key) {
  promise.then(resolve, reject);

  function resolve(value) {
    receiver._callResolve(value, key);
  }

  function reject(reason) {
    receiver._callReject(reason, key);
  }
}

function callProxyReciever(promise, receiver, key) {
  if (promise instanceof AigleCore) {
    switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, key);
        return true;
      case 1:
        receiver._callResolve(promise._value, key);
        return true;
      case 2:
        promise.suppressUnhandledRejections();
        return receiver._callReject(promise._value, key) === true;
    }
  }
  if (promise === errorObj) {
    return receiver._callReject(errorObj.e, key) === true;
  }
  if (promise && promise.then) {
    callProxyThen(promise, receiver, key);
  } else {
    receiver._callResolve(promise, key);
  }
  return true;
}

function callProxyRecieverWithFunc(promise, receiver, index) {
  if (typeof promise === 'function') {
    promise = promise();
  }
  return callProxyReciever(promise, receiver, index);
}

function createArrayIterator(handler) {
  return (receiver, coll, index) => handler(coll[index], receiver, index);
}

function createArrayEach(iterator) {
  return (receiver, times, coll) => {
    let i = -1;
    while (++i < times && iterator(receiver, coll, i)) {}
  };
}

function createObjectIterator(handler) {
  return (receiver, coll, index, result, keys) => {
    const key = keys[index];
    result[key] = undefined;
    return handler(coll[key], receiver, key);
  };
}

function createObjectEach(iterator) {
  return (receiver, times, coll, result, keys) => {
    let i = -1;
    while (++i < times && iterator(receiver, coll, i, result, keys)) {}
  };
}

function createSetIterator(handler) {
  return (receiver, iter, index) => {
    const item = iter.next();
    return item.done === false && handler(item.value, receiver, index);
  };
}

function createSetEach(iterator) {
  return (receiver, times, coll) => {
    const iter = coll[iteratorSymbol]();
    let i = -1;
    while (++i < times && iterator(receiver, iter, i)) {}
  };
}

function createMapIterator(handler) {
  return (receiver, iter, index, result) => {
    const item = iter.next();
    if (item.done) {
      return false;
    }
    const [key, promise] = item.value;
    result.set(key, undefined);
    return handler(promise, receiver, key);
  };
}

function createMapEach(iterator) {
  return (receiver, times, coll, result) => {
    const iter = coll[iteratorSymbol]();
    let i = -1;
    while (++i < times && iterator(receiver, iter, i, result)) {}
  };
}

function compactArray(array) {
  let i = -1;
  const l = array.length;
  const result = [];
  while (++i < l) {
    const value = array[i];
    if (value !== INTERNAL) {
      result.push(value);
    }
  }
  return result;
}

function concatArray(array) {
  let i = -1;
  const l = array.length;
  const result = [];
  while (++i < l) {
    const value = array[i];
    if (Array.isArray(value)) {
      result.push(...value);
    } else if (value !== undefined) {
      result.push(value);
    }
  }
  return result;
}

function clone(target) {
  return Array.isArray(target) ? cloneArray(target) : cloneObject(target);
}

function cloneArray(array) {
  let l = array.length;
  const result = Array(l);
  while (l--) {
    result[l] = array[l];
  }
  return result;
}

function cloneObject(object) {
  const keys = Object.keys(object);
  let l = keys.length;
  const result = {};
  while (l--) {
    const key = keys[l];
    result[key] = object[key];
  }
  return result;
}

function createEmptyObject(object, keys) {
  let i = -1;
  const l = keys.length;
  const result = {};
  while (++i < l) {
    result[keys[i]] = undefined;
  }
  return result;
}

/**
 * @private
 * @param {Array} array
 * @param {number[]} criteria
 */
function sortArray(array, criteria) {
  const l = array.length;
  const indices = Array(l);
  for (let i = 0; i < l; i++) {
    indices[i] = i;
  }
  quickSort(criteria, 0, l - 1, indices);
  const result = Array(l);
  for (let n = 0; n < l; n++) {
    const i = indices[n];
    result[n] = i === undefined ? array[n] : array[i];
  }
  return result;
}

/**
 * @private
 * @param {Object} object
 * @param {string[]} keys
 * @param {number[]} criteria
 */
function sortObject(object, keys, criteria) {
  const l = keys.length;
  const indices = Array(l);
  for (let i = 0; i < l; i++) {
    indices[i] = i;
  }
  quickSort(criteria, 0, l - 1, indices);
  const result = Array(l);
  for (let n = 0; n < l; n++) {
    const i = indices[n];
    result[n] = object[keys[i === undefined ? n : i]];
  }
  return result;
}

function partition(array, i, j, mid, indices) {
  let l = i;
  let r = j;
  while (l <= r) {
    i = l;
    while (l < r && array[l] < mid) {
      l++;
    }
    while (r >= i && array[r] >= mid) {
      r--;
    }
    if (l > r) {
      break;
    }
    swap(array, indices, l++, r--);
  }
  return l;
}

function swap(array, indices, l, r) {
  const n = array[l];
  array[l] = array[r];
  array[r] = n;
  const i = indices[l];
  indices[l] = indices[r];
  indices[r] = i;
}

function quickSort(array, i, j, indices) {
  if (i === j) {
    return;
  }
  let k = i;
  while (++k <= j && array[i] === array[k]) {
    const l = k - 1;
    if (indices[l] > indices[k]) {
      const i = indices[l];
      indices[l] = indices[k];
      indices[k] = i;
    }
  }
  if (k > j) {
    return;
  }
  const p = array[i] > array[k] ? i : k;
  k = partition(array, i, j, array[p], indices);
  quickSort(array, i, k - 1, indices);
  quickSort(array, k, j, indices);
}

function printWarning(message) {
  isNode
    ? console.warn(`\u001b[31m${message}\u001b[0m\n`)
    : console.warn(`%c${message}`, 'color: red');
}

}).call(this,require('_process'))
},{"../../package.json":93,"_process":87,"aigle-core":86}],41:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, call1, apply, callProxyReciever } = require('./internal/util');

class Join extends AigleProxy {
  constructor(handler, size) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = Array(size);
    this._handler = handler;
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      return this._promise._resolve(value);
    }
    this._result[index] = value;
    if (--this._rest !== 0) {
      return;
    }
    const { _handler, _result } = this;
    if (_handler === undefined) {
      this._promise._resolve(_result);
    } else {
      callProxyReciever(apply(_handler, _result), this, INTERNAL);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class Spread extends AigleProxy {
  constructor(handler) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._handler = handler;
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      return this._promise._resolve(value);
    }
    spread(this, value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { join, Spread };

/**
 * @example
 * const p1 = Aigle.delay(20).then(() => 1);
 * const p2 = Aigle.delay(10).then(() => 2);
 * Aigle.join(p1, p2, (v1, v2) => {
 *   console.log(v1, v2); // 1 2
 * });
 */
function join() {
  let l = arguments.length;
  const handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const receiver = new Join(handler, l);
  while (l--) {
    callProxyReciever(arguments[l], receiver, l);
  }
  return receiver._promise;
}

/**
 * @private
 * @param {AigleProxy} proxy
 * @param {string|Array|Object} array
 */
function spread(proxy, array) {
  const { _handler } = proxy;
  if (_handler === undefined) {
    return proxy._promise._resolve(array);
  }
  switch (typeof array) {
    case 'string':
      array = array.split('');
      break;
    case 'object':
      if (Array.isArray(array)) {
        break;
      }
      if (array) {
        const keys = Object.keys(array);
        let l = keys.length;
        const arr = Array(l);
        while (l--) {
          arr[l] = array[keys[l]];
        }
        array = arr;
        break;
      }
    /* eslint no-fallthrough: 0 */
    default:
      /* eslint no-fallthrough: 1 */
      return callProxyReciever(call1(_handler, array), proxy, INTERNAL);
  }
  callProxyReciever(apply(_handler, array), proxy, INTERNAL);
}

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],42:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class Map extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

module.exports = { map, Map };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
 * `Aigle.map` has almost the same functionality as `Array#map`.
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * The `iterator` needs to return a promise or something.
 * Then the result will be assigned to an array and the array order will be ensured.
 * All of them are finished, the function will return an array as a result.
 * @param {Array|Object} collection
 * @param {Function|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.map(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.map(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const collection = [{
 *  uid: 1, name: 'test1'
 * }, {
 *  uid: 4, name: 'test4'
 * }, {
 *  uid: 2, name: 'test2'
 * }];
 * Aigle.map(collection, 'uid')
 *   .then(uids => console.log(uids)); // [1, 4, 2]
 */
function map(collection, iterator) {
  return new Map(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],43:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class MapLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { mapLimit, MapLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
 * `Aigle.mapLimit` is almost the smae as [`Aigle.map`](https://suguru03.github.io/aigle/docs/Aigle.html#map) and
 * [`Aigle.mapSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#mapSeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 10, 6, 8, 4];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 10, 6, 8, 4];
 *     console.log(order); // [1, 3, 5, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 10, 6, 8, 4];
 *     console.log(order); // [1, 2, 3, 4, 5];
 *   });
 */
function mapLimit(collection, limit, iterator) {
  return new MapLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37}],44:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class MapSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }
}

module.exports = { mapSeries, MapSeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
 * `Aigle.mapSeries` is almost the smae as [`Aigle.map`](https://suguru03.github.io/aigle/docs/Aigle.html#map), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [2, 8, 4];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function mapSeries(collection, iterator) {
  return new MapSeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37}],45:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthandWithOrder } = require('./internal/collection');

class MapValues extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { mapValues, MapValues };

function set(collection) {
  setShorthandWithOrder.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  this._result[this._keys[index]] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.mapValues` is similar to [`Aigle.map`](https://suguru03.github.io/aigle/docs/global.html#map).
 * It returns an object instead of an array.
 * @param {Array|Object} collection
 * @param {Function|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValues(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 2, '1': 8, '2': 4 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValues(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 2, b: 8, c: 4 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const collection = {
 *   task1: { uid: 1, name: 'test1' },
 *   task2: { uid: 4, name: 'test4' },
 *   task3: { uid: 2, name: 'test2' }
 * }];
 * Aigle.mapValues(collection, 'uid')
 *   .then(uids => console.log(uids)); // { task1: 1, task2: 4, task3: 2 }
 */
function mapValues(collection, iterator) {
  return new MapValues(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],46:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');
const { createEmptyObject } = require('./internal/util');

class MapValuesLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }
}

module.exports = { mapValuesLimit, MapValuesLimit };

function set(collection) {
  setLimit.call(this, collection);
  if (this._keys === undefined) {
    this._result = {};
    this._callResolve = callResolveArray;
  } else {
    this._result = createEmptyObject(collection, this._keys);
    this._callResolve = callResolveObject;
  }
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  this._result[this._keys[index]] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.mapValuesLimit` is almost the same as [`Aigle.mapValues`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValues) and
 * [`Aigle.mapValuesSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValuesSeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValuesLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 2, '1': 10, '2': 6, '3': 8, '4': 4 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValuesLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 2, b: 10, c: 6, d: 8, e: 4 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValuesLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 2, '1': 10, '2': 6, '3': 8, '4': 4 }
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function mapValuesLimit(collection, limit, iterator) {
  return new MapValuesLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37,"./internal/util":40}],47:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class MapValuesSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { mapValuesSeries, MapValuesSeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  this._result[this._keys[index]] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.mapValuesSeries` is almost the same as [`Aigle.mapValues`](https://suguru03.github.io/aigle/docs/Aigle.html#mapValues), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValuesSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 2, '1': 8, '2': 4 };
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.mapValuesSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 2, b: 8, c: 4 }
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function mapValuesSeries(collection, iterator) {
  return new MapValuesSeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37}],48:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setOmitShorthand } = require('./internal/collection');

class Omit extends Each {
  constructor(collection, iterator, args) {
    if (typeof iterator !== 'function') {
      iterator = [iterator, ...args];
    }
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { omit, Omit };

function set(collection) {
  setOmitShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (!value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  if (!value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.omit` has almost the same functionality as [`Aigle.filter`](https://suguru03.github.io/aigle/docs/global.html#filter).
 * It will return an object as a result.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @param {*} [args]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.omit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 */
function omit(collection, iterator, ...args) {
  return new Omit(collection, iterator, args)._execute();
}

},{"./each":13,"./internal/collection":37}],49:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class OmitBy extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { omitBy, OmitBy };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (!value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  if (!value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.omitBy` has almost the same functionality as [`Aigle.reject`](https://suguru03.github.io/aigle/docs/global.html#reject).
 * It will return an object as a result.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '1': 4, '2': 4 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.omitBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { b: 4, c: 2 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.omitBy(collection, 'active')
 *   .then(object => {
 *     console.log(object); // { '0': { name: 'bargey', active: false } }
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.omitBy(collection, ['name', 'fread'])
 *   .then(object => {
 *     console.log(object); // { '0': { name: 'bargey', active: false } }
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.omitBy(collection, { name: 'fread', active: true })
 *   .then(object => {
 *     console.log(object); // { '0': { name: 'bargey', active: false } }
 *   });
 */
function omitBy(collection, iterator) {
  return new OmitBy(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],50:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class OmitByLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
    this._result = {};
  }
}

module.exports = { omitByLimit, OmitByLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (!value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (!value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.omitByLimit` is almost the as [`Aigle.omitBy`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBy) and
 * [`Aigle.omitBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBySeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '3': 4, '4': 2 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { d: 4, e: 2 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitByLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '3': 4, '4': 2 }
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function omitByLimit(collection, limit, iterator) {
  return new OmitByLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37}],51:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { PENDING } = require('./internal/util');
const { setSeries } = require('./internal/collection');

class OmitBySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }
}

module.exports = { omitBySeries, OmitBySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (!value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (!value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.omitBySeries` is almost the as [`Aigle.omitBy`](https://suguru03.github.io/aigle/docs/Aigle.html#omitBy), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitBySeriesSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '1': 4, '2': 2 }
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitBySeriesSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { b: 4, c: 2 }
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function omitBySeries(collection, iterator) {
  return new OmitBySeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37,"./internal/util":40}],52:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayEachWithFunc,
  promiseObjectEachWithFunc,
  promiseMapEachWithFunc,
  promiseSetEachWithFunc,
  iteratorSymbol,
} = require('./internal/util');
const { callResolve, callResolveMap } = require('./props');

class Parallel extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = undefined;
    this._result = undefined;
    if (coll === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(coll);
    }
  }

  _set(coll) {
    if (Array.isArray(coll)) {
      const size = coll.length;
      this._rest = size;
      this._result = Array(size);
      this._callResolve = callResolve;
      promiseArrayEachWithFunc(this, size, coll);
    } else if (!coll || typeof coll !== 'object') {
      this._rest = 0;
      this._result = {};
    } else if (coll[iteratorSymbol]) {
      const size = coll.size;
      this._rest = size;
      if (coll instanceof Map) {
        const result = new Map();
        this._result = result;
        this._callResolve = callResolveMap;
        promiseMapEachWithFunc(this, Infinity, coll, result);
      } else {
        this._result = Array(this._rest);
        this._callResolve = callResolve;
        promiseSetEachWithFunc(this, Infinity, coll);
      }
    } else {
      const result = {};
      const keys = Object.keys(coll);
      const size = keys.length;
      this._rest = size;
      this._result = result;
      this._callResolve = callResolve;
      promiseObjectEachWithFunc(this, size, coll, result, keys);
    }
    if (this._rest === 0) {
      this._promise._resolve(this._result);
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

module.exports = { parallel, Parallel };

/**
 * `Aigle.parallel` functionality is similar to [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all)
 * and [`Aigle.props`](https://suguru03.github.io/aigle/docs/global.html#props), and the function allows function collection.
 * @param {Array|Object} collection - it should be an array/object of functions or Promise instances
 * @example
 *   Aigle.parallel([
 *     () => Aigle.delay(30, 1),
 *     Aigle.delay(20, 2),
 *     3
 *   ]).then(array => {
 *     console.log(array); // [1, 2, 3]
 *   });
 *
 * @example
 *   Aigle.parallel({
 *     a: () => Aigle.delay(30, 1),
 *     b: Aigle.delay(20, 2),
 *     c: 3
 *   }).then(obj => {
 *     console.log(obj); // { a: 1, b: 2, c: 3 }
 *   });
 */
function parallel(collection) {
  return new Parallel(collection)._promise;
}

},{"./aigle":2,"./internal/util":40,"./props":60,"aigle-core":86}],53:[function(require,module,exports){
'use strict';

const { Series } = require('./series');
const { DEFAULT_LIMIT } = require('./internal/util');

class ParallelLimit extends Series {
  constructor(coll, limit = DEFAULT_LIMIT) {
    super(coll);
    this._size = this._rest;
    this._limit = limit;
  }

  _execute() {
    const { _limit, _rest } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
      return this._promise;
    }
    this._size = _rest;
    this._iterate = iterate;
    let limit = _limit < _rest ? _limit : _rest;
    while (limit--) {
      this._iterate();
    }
    return this._promise;
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }

  _callResolveMap(value, key) {
    this._result.set(key, value);
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { parallelLimit, ParallelLimit };

function iterate() {
  ++this._index < this._size &&
    this._iterator(this, this._coll, this._index, this._result, this._keys);
}

/**
 * `Aigle.parallel` functionality has the same functionality as [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel)
 * and it works with concurrency.
 * @param {Array|Object} collection - it should be an array/object of functions or Promise instances
 * @param {integer} [limit=8] - It is concurrncy, default is 8
 * @example
 *   Aigle.parallelLimit([
 *     () => Aigle.delay(30, 1),
 *     Aigle.delay(20, 2),
 *     3
 *   ]).then(array => {
 *     console.log(array); // [1, 2, 3]
 *   });
 *
 * @example
 *   Aigle.parallelLimit({
 *     a: () => Aigle.delay(30, 1),
 *     b: Aigle.delay(20, 2),
 *     c: 3
 *   }, 2).then(obj => {
 *     console.log(obj); // { a: 1, b: 2, c: 3 }
 *   });
 */
function parallelLimit(collection, limit) {
  return new ParallelLimit(collection, limit)._execute();
}

},{"./internal/util":40,"./series":67}],54:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setPickShorthand } = require('./internal/collection');

class Pick extends Each {
  constructor(collection, iterator, args) {
    if (typeof iterator !== 'function') {
      iterator = [iterator, ...args];
    }
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { pick, Pick };

function set(collection) {
  setPickShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  if (value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.pick` has almost the same functionality as [`Aigle.filter`](https://suguru03.github.io/aigle/docs/global.html#filter).
 * It will return an object as a result.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @param {*} [args]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.pick(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.pick(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 */
function pick(collection, iterator, ...args) {
  return new Pick(collection, iterator, args)._execute();
}

},{"./each":13,"./internal/collection":37}],55:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class PickBy extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { pickBy, PickBy };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(value, index) {
  if (value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.pickBy` has almost the same functionality as [`Aigle.filter`](https://suguru03.github.io/aigle/docs/global.html#filter).
 * It will return an object as a result.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.pickBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.pickBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.pickBy(collection, 'active')
 *   .then(object => {
 *     console.log(object); // { '1': { name: 'fread', active: true } }
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.pickBy(collection, ['name', 'fread'])
 *   .then(object => {
 *     console.log(object); // { '1': { name: 'fread', active: true } }
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.pickBy(collection, { name: 'fread', active: true })
 *   .then(object => {
 *     console.log(object); // { '1': { name: 'fread', active: true } }
 *   });
 */
function pickBy(collection, iterator) {
  return new PickBy(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],56:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class PickByLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
    this._result = {};
  }
}

module.exports = { pickByLimit, PickByLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.pickByLimit` is almost the as [`Aigle.pickBy`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBy) and
 * [`Aigle.pickBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBySeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.pickByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1, '1': 5, '2': 3 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.pickByLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1, b: 5, c: 3 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.pickByLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1, '1': 5, '2': 3 }
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function pickByLimit(collection, limit, iterator) {
  return new PickByLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37}],57:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class PickBySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { pickBySeries, PickBySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.pickBySeries` is almost the as [`Aigle.pickBy`](https://suguru03.github.io/aigle/docs/Aigle.html#pickBy), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.pickBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1 }
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num * 2;
 *     });
 * };
 * Aigle.pickBySeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function pickBySeries(collection, iterator) {
  return new PickBySeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37}],58:[function(require,module,exports){
(function (setImmediate){
'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callThen } = require('./internal/util');

const globalSetImmediate = typeof setImmediate === 'function' ? setImmediate : {};
const custom =
  (() => {
    try {
      return require('util').promisify.custom;
    } catch (e) {
      return;
    }
  })() || {};

module.exports = promisify;

/**
 * @param {Object|Function} fn
 * @param {string|number|Object} [fn]
 * @param {Object} [fn.context]
 * @example
 * const func = (a, b, c, callback) => callback(null, a + b + c);
 * Aigle.promisify(func)(1, 2, 3)
 *   .then(value => console.log(value)); // 6
 *
 * @example
 * const obj = {
 *   val: 1,
 *   get(callback) {
 *     callback(null, this.val);
 *   }
 * };
 *
 * // using bind
 * Aigle.promisify(obj.get.bind(obj))().then(console.log);
 *
 * // using context
 * Aigle.promisify(obj.get, { context: obj })().then(console.log);
 *
 * // using shorthand
 * Aigle.promisify(obj, 'get')().then(console.log);
 */
function promisify(fn, opts) {
  switch (typeof fn) {
    case 'object':
      switch (typeof opts) {
        case 'string':
        case 'number':
          if (typeof fn[opts] !== 'function') {
            throw new TypeError('Function not found key: ' + opts);
          }
          if (fn[opts].__isPromisified__) {
            return fn[opts];
          }
          return makeFunctionByKey(fn, opts);
        default:
          throw new TypeError('Second argument is invalid');
      }
    case 'function':
      if (fn.__isPromisified__) {
        return fn;
      }
      const ctx = opts && opts.context !== undefined ? opts.context : undefined;
      return makeFunction(fn, ctx);
    default:
      throw new TypeError('Type of first argument is not function');
  }
}

/**
 * @private
 * @param {Aigle} promise
 */
function makeCallback(promise) {
  return (err, res) => (err ? promise._reject(err) : promise._resolve(res));
}

/**
 * @private
 * @param {Object} obj
 * @param {string} key
 */
function makeFunctionByKey(obj, key) {
  promisified.__isPromisified__ = true;
  return promisified;

  function promisified(arg) {
    const promise = new Aigle(INTERNAL);
    const callback = makeCallback(promise);
    let l = arguments.length;
    switch (l) {
      case 0:
        obj[key](callback);
        break;
      case 1:
        obj[key](arg, callback);
        break;
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        args[args.length] = callback;
        obj[key].apply(obj, args);
        break;
    }
    return promise;
  }
}

/**
 * @private
 * @param {function} fn
 * @param {*} [ctx]
 */
function makeFunction(fn, ctx) {
  const func = fn[custom];
  if (func) {
    nativePromisified.__isPromisified__ = true;
    return nativePromisified;
  }
  switch (fn) {
    case setTimeout:
      return Aigle.delay;
    case globalSetImmediate:
      return Aigle.resolve;
  }
  promisified.__isPromisified__ = true;
  return promisified;

  function nativePromisified(arg) {
    const promise = new Aigle(INTERNAL);
    let l = arguments.length;
    let p;
    switch (l) {
      case 0:
        p = func.call(ctx || this);
        break;
      case 1:
        p = func.call(ctx || this, arg);
        break;
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        p = func.apply(ctx || this, args);
        break;
    }
    callThen(p, promise);
    return promise;
  }

  function promisified(arg) {
    const promise = new Aigle(INTERNAL);
    const callback = makeCallback(promise);
    let l = arguments.length;
    switch (l) {
      case 0:
        fn.call(ctx || this, callback);
        break;
      case 1:
        fn.call(ctx || this, arg, callback);
        break;
      default:
        const args = Array(l);
        while (l--) {
          args[l] = arguments[l];
        }
        args[args.length] = callback;
        fn.apply(ctx || this, args);
        break;
    }
    return promise;
  }
}

}).call(this,require("timers").setImmediate)
},{"./aigle":2,"./internal/util":40,"timers":89,"util":92}],59:[function(require,module,exports){
'use strict';

const promisify = require('./promisify');
const skipMap = {
  constructor: true,
  arity: true,
  length: true,
  name: true,
  arguments: true,
  caller: true,
  callee: true,
  prototype: true,
  __isPromisified__: true,
};

module.exports = promisifyAll;

/**
 * @param {Object} target
 * @param {Object} [opts]
 * @param {String} [opts.suffix=Async]
 * @param {Function} [opts.filter]
 * @param {Integer} [opts.depth=2]
 * @example
 * const redis = require('redis');
 * Aigle.promisifyAll(redis);
 * const client = redis.createClient();
 *
 * const key = 'test';
 * redis.hsetAsync(key, 1)
 *   .then(() => redis.hgetAsync(key))
 *   .then(value => console.log(value)); // 1
 */
function promisifyAll(target, opts) {
  const { suffix = 'Async', filter = defaultFilter, depth = 2 } = opts || {};
  _promisifyAll(suffix, filter, target, undefined, undefined, depth);
  return target;
}

function defaultFilter(name) {
  return /^(?!_).*/.test(name);
}

function _promisifyAll(suffix, filter, obj, key, target, depth) {
  const memo = {};
  switch (typeof obj) {
    case 'function':
      if (target) {
        if (obj.__isPromisified__) {
          return;
        }
        const _key = `${key}${suffix}`;
        if (target[_key]) {
          if (!target[_key].__isPromisified__) {
            throw new TypeError(
              `Cannot promisify an API that has normal methods with '${suffix}'-suffix`
            );
          }
        } else {
          target[_key] = promisify(obj);
        }
      }
      iterate(suffix, filter, obj, obj, depth, memo);
      iterate(suffix, filter, obj.prototype, obj.prototype, depth, memo);
      break;
    case 'object':
      if (!obj) {
        break;
      }
      iterate(suffix, filter, obj, obj, depth, memo);
      iterate(suffix, filter, Object.getPrototypeOf(obj), obj, depth, memo);
  }
}

const fp = Function.prototype;
const op = Object.prototype;
const ap = Array.prototype;

function iterate(suffix, filter, obj, target, depth, memo) {
  if (depth-- === 0 || !obj || fp === obj || op === obj || ap === obj || Object.isFrozen(obj)) {
    return;
  }
  const keys = Object.getOwnPropertyNames(obj);
  let l = keys.length;
  while (l--) {
    const key = keys[l];
    if (skipMap[key] === true || memo[key] === true || !filter(key)) {
      continue;
    }
    const desc = Object.getOwnPropertyDescriptor(obj, key);
    if (!desc || desc.set || desc.get) {
      continue;
    }
    memo[key] = true;
    _promisifyAll(suffix, filter, obj[key], key, target, depth);
  }
}

},{"./promisify":58}],60:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING, promiseObjectEach, promiseMapEach } = require('./internal/util');

class Props extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = 0;
    this._result = undefined;
    if (coll === PENDING) {
      this._callResolve = this._set;
    } else {
      this._callResolve = undefined;
      this._set(coll);
    }
  }

  _set(coll) {
    if (typeof coll !== 'object' || coll === null) {
      this._result = {};
    } else if (coll instanceof Map) {
      const result = new Map();
      this._result = result;
      this._rest = coll.size;
      this._callResolve = callResolveMap;
      promiseMapEach(this, Infinity, coll, result);
    } else {
      const keys = Object.keys(coll);
      const size = keys.length;
      const result = {};
      this._result = result;
      this._rest = size;
      this._callResolve = callResolve;
      promiseObjectEach(this, size, coll, result, keys);
    }
    if (this._rest === 0) {
      this._promise._resolve(this._result);
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

module.exports = { props, Props, callResolve, callResolveMap };

function callResolve(value, key) {
  this._result[key] = value;
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveMap(value, key) {
  this._result.set(key, value);
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * `Aigle.props` is almost the same functionality as [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all)
 * But the function allows an object as the first argument instead of an array.
 * @param {Object} object
 * @example
 * const order = [];
 * const makeDelay = (num, delay) => {
 *   return Aigle.delay(delay)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.props({
 *   a: makeDelay(1, 30),
 *   b: makeDelay(2, 20),
 *   c: makeDelay(3, 10)
 * })
 * .then(object => {
 *   console.log(object); // { a: 1, b: 2, c: 3 }
 *   console.log(order); // [3, 2, 1]
 * });
 */
function props(object) {
  return new Props(object)._promise;
}

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],61:[function(require,module,exports){
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
  iteratorSymbol,
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

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],62:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { execute, setSeries } = require('./internal/collection');
const { INTERNAL, PENDING, call3, callProxyReciever } = require('./internal/util');

class Reduce extends AigleProxy {
  constructor(collection, iterator, result) {
    super();
    this._result = result;
    this._iterator = iterator;
    this._promise = new Aigle(INTERNAL);
    this._coll = undefined;
    this._rest = undefined;
    this._size = undefined;
    this._keys = undefined;
    this._iterate = undefined;
    if (collection === PENDING) {
      this._set = set;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, collection);
    }
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._iterate(++index, result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { reduce, Reduce };

function set(collection) {
  setSeries.call(this, collection);
  if (this._keys === undefined) {
    this._iterate = iterateArray;
    this._execute = executeArray;
  } else {
    this._iterate = iterateObject;
    this._execute = executeObject;
  }
  return this;
}

function iterateArray(index, result) {
  callProxyReciever(call3(this._iterator, result, this._coll[index], index), this, index);
}

function iterateObject(index, result) {
  const key = this._keys[index];
  callProxyReciever(call3(this._iterator, result, this._coll[key], key), this, index);
}

function executeArray() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._result === undefined) {
    this._callResolve(this._coll[0], 0);
  } else {
    this._iterate(0, this._result);
  }
  return this._promise;
}

function executeObject() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._result === undefined) {
    this._callResolve(this._coll[this._keys[0]], 0);
  } else {
    this._iterate(0, this._result);
  }
  return this._promise;
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {*} [result]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result + num);
 * };
 * return Aigle.reduce(collection, iterator, 1)
 *   .then(value => console.log(value)); // 8
 *
 * @example
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result + num);
 * };
 * return Aigle.reduce(collection, iterator, '')
 *   .then(value => console.log(value)); // '142'
 */
function reduce(collection, iterator, result) {
  return new Reduce(collection, iterator, result)._execute();
}

},{"./aigle":2,"./internal/collection":37,"./internal/util":40,"aigle-core":86}],63:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');
const { INTERNAL, compactArray } = require('./internal/util');

class Reject extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { reject, Reject };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[index];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[this._keys[index]];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  }
}

/**
 * Aigle reject has two features.
 * One of them is basic [`Promise.reject`](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject) function, it returns a rejected Aigle instance.
 * The other is a collection function, it requires an iterator function. It is the opposite of [`filter`](https://suguru03.github.io/aigle/docs/Aigle.html#filter).
 * If the iterator function is not defined, the function works as a first one.
 *
 * @param {Function|Array|Object} collection
 * @param {Function|Array|Object|string} [iterator]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const error = new Error('error');
 * Aigle.reject(error)
 *   .catch(error => {
 *     console.log(error); // error
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.reject(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.reject(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.reject(collection, 'active')
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: false }]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.reject(collection, ['name', 'bargey'])
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: false }]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.reject(collection, { name: 'bargey', active: false })
 *   .then(array => {
 *     console.log(array); // [{ name: 'fread', active: false }]
 *   });
 */
function reject(collection, iterator) {
  return new Reject(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37,"./internal/util":40}],64:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');
const { INTERNAL, compactArray } = require('./internal/util');

class RejectLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }
}

module.exports = { rejectLimit, RejectLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[index];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[this._keys[index]];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.rejectLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2]
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.rejectLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2]
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.rejectLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2]
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function rejectLimit(collection, limit, iterator) {
  return new RejectLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37,"./internal/util":40}],65:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');
const { INTERNAL, compactArray } = require('./internal/util');

class RejectSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { rejectSeries, RejectSeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[index];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  this._result[index] = value ? INTERNAL : this._coll[this._keys[index]];
  if (--this._rest === 0) {
    this._promise._resolve(compactArray(this._result));
  } else {
    this._iterate();
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.rejectSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 4, 2];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.rejectSeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [4, 2];
 *     console.log(order); // [1, 4, 2];
 *   });
 */
function rejectSeries(collection, iterator) {
  return new RejectSeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37,"./internal/util":40}],66:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, call0, callProxyReciever } = require('./internal/util');
const DEFAULT_RETRY = 5;

class Retry extends AigleProxy {
  constructor(opts, handler) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._handler = handler;
    this._count = 0;
    this._times = DEFAULT_RETRY;
    this._interval = undefined;
    switch (opts && typeof opts) {
      case 'function':
        this._handler = opts;
        break;
      case 'object':
        const { interval, times, predicate } = opts;
        this._times = times || DEFAULT_RETRY;
        this._predicate = predicate;
        if (this._predicate && typeof this._predicate !== 'function') {
          throw new Error('predicate needs to be a function');
        }
        this._interval =
          typeof interval === 'function' ? interval : interval ? () => interval : undefined;
        this._iterate = this._iterate.bind(this);
        break;
      default:
        this._times = opts;
        break;
    }
    this._iterate();
  }

  _iterate() {
    callProxyReciever(call0(this._handler), this, undefined);
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }

  _callReject(reason) {
    if ((this._predicate && !this._predicate(reason)) || ++this._count === this._times) {
      this._promise._reject(reason);
    } else if (this._interval !== undefined) {
      setTimeout(this._iterate, this._interval(this._count));
    } else {
      this._iterate();
    }
  }
}

module.exports = retry;

/**
 * @param {Integer|Object} [times=5]
 * @param {Function} handler
 * @example
 * let called = 0;
 * Aigle.retry(3, () => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 3
 *   console.log(called); // 3
 * });
 *
 * @example
 * let called = 0;
 * Aigle.retry(() => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 5
 *   console.log(called); // 5
 * });
 *
 * @example
 * let called = 0;
 * const opts = {
 *   times: 5,
 *   interval: 10
 * };
 * Aigle.retry(opts, () => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 5
 *   console.log(called); // 5
 * });
 *
 * @example
 * let called = 0;
 * const opts = {
 *   times: 5,
 *   interval: c => c * 2;
 * };
 * Aigle.retry(opts, () => {
 *   return new Aigle((resolve, reject) => {
 *     setTimeout(() => reject(++called), 10);
 *   });
 * })
 * .catch(error => {
 *   console.log(error); // 5
 *   console.log(called); // 5
 * });
 */
function retry(opts, handler) {
  return new Retry(opts, handler)._promise;
}

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],67:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  promiseArrayIterator,
  promiseObjectIterator,
  promiseSetIterator,
  promiseMapIterator,
  iteratorSymbol,
} = require('./internal/util');
const { execute } = require('./internal/collection');

class Series extends AigleProxy {
  constructor(coll) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._index = -1;
    this._coll = undefined;
    this._keys = undefined;
    this._rest = undefined;
    this._result = undefined;
    this._iterate = undefined;
    if (coll === PENDING) {
      this._set = set;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, coll);
    }
  }

  _execute() {
    this._iterate();
    return this._promise;
  }

  _callResolve(value, key) {
    this._result[key] = value;
    this._iterate();
  }

  _callResolveMap(value, key) {
    this._result.set(key, value);
    this._iterate();
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { series, Series };

function set(coll) {
  this._coll = coll;
  this._iterate = iterate;
  if (Array.isArray(coll)) {
    const size = coll.length;
    this._rest = size;
    this._result = Array(size);
    this._iterator = promiseArrayIterator;
  } else if (typeof coll !== 'object' || coll === null) {
    this._rest = 0;
    this._result = {};
  } else if (coll[iteratorSymbol]) {
    this._coll = coll[iteratorSymbol]();
    const size = coll.size;
    this._rest = size;
    if (coll instanceof Map) {
      const result = new Map();
      this._result = result;
      this._callResolve = this._callResolveMap;
      this._iterator = promiseMapIterator;
    } else {
      this._result = [];
      this._iterator = promiseSetIterator;
    }
  } else {
    const result = {};
    const keys = Object.keys(coll);
    this._rest = keys.length;
    this._keys = keys;
    this._result = result;
    this._iterator = promiseObjectIterator;
  }
  return this;
}

function iterate() {
  if (++this._index === this._rest) {
    this._promise._resolve(this._result);
  } else {
    this._iterator(this, this._coll, this._index, this._result, this._keys);
  }
}

/**
 * `Aigle.series` functionality has the same functionality as [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel)
 * and it works in series.
 * @param {Array|Object} collection - it should be an array/object of functions or Promise instances
 * @example
 *   Aigle.series([
 *     () => Aigle.delay(30, 1),
 *     Aigle.delay(20, 2),
 *     3
 *   ]).then(array => {
 *     console.log(array); // [1, 2, 3]
 *   });
 *
 * @example
 *   Aigle.series({
 *     a: () => Aigle.delay(30, 1),
 *     b: Aigle.delay(20, 2),
 *     c: 3
 *   }).then(obj => {
 *     console.log(obj); // { a: 1, b: 2, c: 3 }
 *   });
 */
function series(collection) {
  return new Series(collection)._execute();
}

},{"./aigle":2,"./internal/collection":37,"./internal/util":40,"aigle-core":86}],68:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class Some extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, setShorthand);
    this._result = false;
  }

  _callResolve(value) {
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  }
}

module.exports = { some, Some };

/**
 * `Aigle.some` has almost the same functionality as `Array#some`.
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * The `iterator` needs to return a promise or something..
 * If a promise is returned, the function will wait until the promise is fulfilled.
 * If the result is truthy, the function will return true otherwise false.
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.some(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.some(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return false;
 *     });
 * };
 * Aigle.some(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // false
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const collection = [{
 *  uid: 1, active: false
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.some(collection, 'active')
 *   .then(value => console.log(value)); // true
 *
 * @example
 * const collection = [{
 *  uid: 1, active: false
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.some(collection, ['uid', 4])
 *   .then(value => console.log(value)); // true
 *
 * @example
 * const collection = [{
 *  uid: 1, active: false
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.some(collection, { uid: 4 })
 *   .then(value => console.log(value)); // true
 */
function some(collection, iterator) {
  return new Some(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37}],69:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');

class SomeLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator);
    this._result = false;
  }

  _callResolve(value) {
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { someLimit, SomeLimit };

/**
 * `Aigle.someLimit` is almost the as [`Aigle.some`](https://suguru03.github.io/aigle/docs/Aigle.html#some) and
 * [`Aigle.someSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#someSeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someLimit(collection, 2, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 3, 5, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someLimit(collection, 2, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 3, 5, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someLimit(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 2]
 *   });
 */
function someLimit(collection, limit, iterator) {
  return new SomeLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14}],70:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries.js');

class SomeSeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator);
    this._result = false;
  }

  _callResolve(value) {
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    } else {
      this._iterate();
    }
  }
}

module.exports = { someSeries, SomeSeries };

/**
 * `Aigle.someSeries` is almost the as [`Aigle.some`](https://suguru03.github.io/aigle/docs/Aigle.html#some), but it will work in series.
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someSeries(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2 === 0;
 *     });
 * };
 * Aigle.someSeries(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // true
 *     console.log(order); // [1, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return false;
 *     });
 * };
 * Aigle.someSeries(collection, iterator)
 *   .then(bool => {
 *     console.log(bool); // false
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function someSeries(collection, iterator) {
  return new SomeSeries(collection, iterator)._execute();
}

},{"./eachSeries.js":15}],71:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');
const { sortArray, sortObject } = require('./internal/util');

class SortBy extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { sortBy, SortBy };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortArray(this._coll, this._result));
  }
}

function callResolveObject(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortObject(this._coll, this._keys, this._result));
  }
}

/**
 * It iterates all elements of `collection` and executes `iterator` using each element on parallel.
 * It creates a sorted array which is ordered by results of iterator.
 * @param {Array|Object} collection
 * @param {Function|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortBy(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortBy(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [{
 *   uid: 2, name: 'bargey', uid: 2
 * }, {
 *   uid: 1, name: 'fread'
 * }];
 * Aigle.sortBy(collection, 'uid')
 *   .then(array => {
 *     console.log(array); // [{ uid: 1, name: 'fread' }, { uid: 2, name: 'bargey' ]
 *   });
 */
function sortBy(collection, iterator) {
  return new SortBy(collection, iterator)._execute();
}

},{"./each":13,"./internal/collection":37,"./internal/util":40}],72:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');
const { sortArray, sortObject } = require('./internal/util');

class SortByLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
  }
}

module.exports = { sortByLimit, SortByLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortArray(this._coll, this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortObject(this._coll, this._keys, this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.sortByLimit` is almost the smae as [`Aigle.sortBy`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBy) and
 * [`Aigle.sortBySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBySeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortByLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5]
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortByLimit(collection, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5]
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortByLimit(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4, 5]
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function sortByLimit(collection, limit, iterator) {
  return new SortByLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37,"./internal/util":40}],73:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');
const { sortArray, sortObject } = require('./internal/util');

class SortBySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { sortBySeries, SortBySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortArray(this._coll, this._result));
  } else {
    this._iterate();
  }
}

function callResolveObject(criterion, index) {
  this._result[index] = criterion;
  if (--this._rest === 0) {
    this._promise._resolve(sortObject(this._coll, this._keys, this._result));
  } else {
    this._iterate();
  }
}

/**
 * `Aigle.sortBySeries` is almost the smae as [`Aigle.sortBy`](https://suguru03.github.io/aigle/docs/Aigle.html#sortBy), but it will work in series.
 *
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortBySeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num;
 *     });
 * };
 * Aigle.sortBySeries(collection, iterator)
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function sortBySeries(collection, iterator) {
  return new SortBySeries(collection, iterator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37,"./internal/util":40}],74:[function(require,module,exports){
'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callResolve } = require('./internal/util');

// TODO refactor
function tap(value, onFulfilled) {
  const promise = new Aigle(INTERNAL);
  callResolve(promise, onFulfilled, value);
  return promise.then(() => value);
}

module.exports = tap;

},{"./aigle":2,"./internal/util":40}],75:[function(require,module,exports){
'use strict';

const Aigle = require('./aigle');
const { INTERNAL, callResolve } = require('./internal/util');

function thru(value, onFulfilled) {
  const promise = new Aigle(INTERNAL);
  callResolve(promise, onFulfilled, value);
  return promise;
}

module.exports = thru;

},{"./aigle":2,"./internal/util":40}],76:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { TimeoutError } = require('./error');
const { INTERNAL } = require('./internal/util');

class Timeout extends AigleProxy {
  constructor(ms, message = 'operation timed out') {
    super();
    this._promise = new Aigle(INTERNAL);
    this._timer = setTimeout(
      () => this._callReject(message instanceof Error ? message : new TimeoutError(message)),
      ms
    );
  }

  _callResolve(value) {
    clearTimeout(this._timer);
    this._promise._resolve(value);
  }

  _callReject(reason) {
    clearTimeout(this._timer);
    this._promise._reject(reason);
  }
}

module.exports = Timeout;

},{"./aigle":2,"./error":16,"./internal/util":40,"aigle-core":86}],77:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, PENDING, defaultIterator, call1, callProxyReciever } = require('./internal/util');

class Times extends AigleProxy {
  constructor(times, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._iterator = typeof iterator === 'function' ? iterator : defaultIterator;
    this._rest = undefined;
    this._result = undefined;
    if (times === PENDING) {
      this._rest = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, times);
    }
  }

  _execute() {
    if (this._rest >= 1) {
      const { _rest, _iterator } = this;
      let i = -1;
      while (++i < _rest && callProxyReciever(call1(_iterator, i), this, i)) {}
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { times, Times, set, execute };

function set(times) {
  times = +times | 0;
  if (times >= 1) {
    this._rest = times;
    this._result = Array(times);
  } else {
    this._rest = 0;
    this._result = [];
  }
}

function execute(times) {
  this._callResolve = this._rest;
  set.call(this, times);
  this._execute();
}

/**
 * @param {integer} times
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const timer = [30, 20, 10];
 * const iterator = n => {
 *   return Aigle.delay(timer[n])
 *     .then(() => {
 *       order.push(n);
 *       return n;
 *     });
 * };
 * Aigle.times(3, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [2, 1, 0]
 *   });
 */
function times(times, iterator) {
  return new Times(times, iterator)._execute();
}

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],78:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const {
  INTERNAL,
  PENDING,
  DEFAULT_LIMIT,
  defaultIterator,
  call1,
  callProxyReciever,
} = require('./internal/util');

class TimesLimit extends AigleProxy {
  constructor(times, limit, iterator) {
    super();
    if (typeof limit === 'function') {
      iterator = limit;
      limit = DEFAULT_LIMIT;
    }
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._limit = limit;
    this._iterator = typeof iterator === 'function' ? iterator : defaultIterator;
    this._rest = undefined;
    this._result = undefined;
    this._callRest = undefined;
    if (times === PENDING) {
      this._rest = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, times);
    }
  }

  _execute() {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (this._limit--) {
        this._iterate();
      }
    }
    return this._promise;
  }

  _iterate() {
    const i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  }
}

module.exports = { timesLimit, TimesLimit };

function set(times) {
  times = +times | 0;
  if (times >= 1) {
    this._rest = times;
    this._result = Array(times);
    const { _limit } = this;
    this._limit = _limit < times ? _limit : times;
    this._callRest = times - this._limit;
  } else {
    this._rest = 0;
    this._result = [];
  }
}

function execute(times) {
  this._callResolve = this._rest;
  set.call(this, times);
  this._execute();
}

/**
 * @param {integer} times
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const timer = [30, 20, 10];
 * const iterator = n => {
 *   return Aigle.delay(timer[n])
 *     .then(() => {
 *       order.push(n);
 *       return n;
 *     });
 * };
 * Aigle.timesLimit(3, 2, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [1, 0, 2]
 *   });
 *
 * @example
 * const order = [];
 * const timer = [30, 20, 10];
 * const iterator = n => {
 *   return Aigle.delay(timer[n])
 *     .then(() => {
 *       order.push(n);
 *       return n;
 *     });
 * };
 * Aigle.timesLimit(3, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [2, 1, 0]
 *   });
 */
function timesLimit(times, limit, iterator) {
  return new TimesLimit(times, limit, iterator)._execute();
}

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],79:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { set, execute } = require('./times');
const { INTERNAL, PENDING, defaultIterator, call1, callProxyReciever } = require('./internal/util');

class TimesSeries extends AigleProxy {
  constructor(times, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._iterator = typeof iterator === 'function' ? iterator : defaultIterator;
    this._index = 0;
    this._rest = undefined;
    this._result = undefined;
    if (times === PENDING) {
      this._rest = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, times);
    }
  }

  _execute() {
    if (this._rest >= 1) {
      this._iterate();
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  }

  _iterate() {
    const i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { timesSeries, TimesSeries };

/**
 * @param {integer} times
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const timer = [30, 20, 10];
 * const iterator = n => {
 *   return Aigle.delay(timer[n])
 *     .then(() => {
 *       order.push(n);
 *       return n;
 *     });
 * };
 * Aigle.timesSeries(3, iterator)
 *   .then(array => {
 *     console.log(array); // [0, 1, 2]
 *     console.log(order); // [0, 1, 2]
 *   });
 */
function timesSeries(times, iterator) {
  return new TimesSeries(times, iterator)._execute();
}

},{"./aigle":2,"./internal/util":40,"./times":77,"aigle-core":86}],80:[function(require,module,exports){
'use strict';

const { Each } = require('./each');
const { setParallel } = require('./internal/collection');
const { call3, callProxyReciever, clone } = require('./internal/util');

class Transform extends Each {
  constructor(collection, iterator, accumulator) {
    super(collection, iterator, set);
    if (accumulator !== undefined) {
      this._result = accumulator;
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

module.exports = { transform, Transform };

function set(collection) {
  setParallel.call(this, collection);
  if (this._keys !== undefined || this._coll === undefined) {
    if (this._result === undefined) {
      this._result = {};
    }
    this._iterate = iterateObject;
  } else {
    if (this._result === undefined) {
      this._result = [];
    }
    this._iterate = iterateArray;
  }
  return this;
}

function iterateArray() {
  const { _rest, _result, _iterator, _coll } = this;
  let i = -1;
  while (++i < _rest && callProxyReciever(call3(_iterator, _result, _coll[i], i), this, i)) {}
}

function iterateObject() {
  const { _rest, _result, _iterator, _coll, _keys } = this;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    if (callProxyReciever(call3(_iterator, _result, _coll[key], key), this, i) === false) {
      break;
    }
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result[index] = num;
 *     });
 * };
 * Aigle.transform(collection, iterator, {})
 *   .then(object => {
 *     console.log(object); // { '0': 1, '1': 4, '2': 2 }
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *     });
 * };
 * Aigle.transform(collection, iterator, {})
 *   .then(array => {
 *     console.log(array); // [1, 2, 4]
 *     console.log(order); // [1, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *       return num !== 2;
 *     });
 * };
 * Aigle.transform(collection, iterator, [])
 *   .then(array => {
 *     console.log(array); // [1, 2]
 *     console.log(order); // [1, 2]
 *   });
 */
function transform(collection, iterator, accumulator) {
  return new Transform(collection, iterator, accumulator)._execute();
}

},{"./each":13,"./internal/collection":37,"./internal/util":40}],81:[function(require,module,exports){
'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');
const { DEFAULT_LIMIT, call3, callProxyReciever, clone } = require('./internal/util');

class TransformLimit extends EachLimit {
  constructor(collection, limit, iterator, accumulator) {
    if (typeof limit === 'function') {
      accumulator = iterator;
      iterator = limit;
      limit = DEFAULT_LIMIT;
    }
    super(collection, limit, iterator, set);
    if (accumulator !== undefined) {
      this._result = accumulator;
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { transformLimit, TransformLimit };

function set(collection) {
  setLimit.call(this, collection);
  if (this._keys !== undefined || this._coll === undefined) {
    if (this._result === undefined) {
      this._result = {};
    }
    this._iterate = iterateObject;
  } else {
    if (this._result === undefined) {
      this._result = [];
    }
    this._iterate = iterateArray;
  }
  return this;
}

function iterateArray() {
  const index = this._index++;
  callProxyReciever(call3(this._iterator, this._result, this._coll[index], index), this, index);
}

function iterateObject() {
  const index = this._index++;
  const key = this._keys[index];
  callProxyReciever(call3(this._iterator, this._result, this._coll[key], key), this, index);
}

/**
 * @param {Array|Object} collection
 * @param {integer} [limit]
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result[index] = num;
 *     });
 * };
 * Aigle.transformLimit(collection, 2, iterator, {})
 *   .then(object => {
 *     console.log(object); // { '0': 1, '1': 5, '2': 3, '3': 4, '4': 2 }
 *     console.log(order); // [1, 5, 3, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *     });
 * };
 * Aigle.transformLimit(collection, 2, iterator, {})
 *   .then(array => {
 *     console.log(array); // [1, 5, 3, 4, 2]
 *     console.log(order); // [1, 5, 3, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *       return num !== 4;
 *     });
 * };
 * Aigle.transformLimit(collection, 2, iterator, [])
 *   .then(array => {
 *     console.log(array); // [1, 5, 3, 4]
 *     console.log(order); // [1, 5, 3, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *       return num !== 4;
 *     });
 * };
 * Aigle.transformLimit(collection, iterator, [])
 *   .then(array => {
 *     console.log(array); // [1, 2, 3, 4]
 *     console.log(order); // [1, 2, 3, 4]
 *   });
 */
function transformLimit(collection, limit, iterator, accumulator) {
  return new TransformLimit(collection, limit, iterator, accumulator)._execute();
}

},{"./eachLimit":14,"./internal/collection":37,"./internal/util":40}],82:[function(require,module,exports){
'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');
const { call3, callProxyReciever, clone } = require('./internal/util');

class TransformSeries extends EachSeries {
  constructor(collection, iterator, accumulator) {
    super(collection, iterator, set);
    if (accumulator !== undefined) {
      this._result = accumulator;
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }
}

module.exports = { transformSeries, TransformSeries };

function set(collection) {
  setSeries.call(this, collection);
  if (this._keys !== undefined || this._coll === undefined) {
    if (this._result === undefined) {
      this._result = {};
    }
    this._iterate = iterateObject;
  } else {
    if (this._result === undefined) {
      this._result = [];
    }
    this._iterate = iterateArray;
  }
  return this;
}

function iterateArray() {
  const index = this._index++;
  callProxyReciever(call3(this._iterator, this._result, this._coll[index], index), this, index);
}

function iterateObject() {
  const index = this._index++;
  const key = this._keys[index];
  callProxyReciever(call3(this._iterator, this._result, this._coll[key], key), this, index);
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result[index] = num;
 *     });
 * };
 * Aigle.transformSeries(collection, iterator, {})
 *   .then(object => {
 *     console.log(object); // { '0': 1, '1': 4, '2': 2 }
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *     });
 * };
 * Aigle.transformSeries(collection, iterator, {})
 *   .then(array => {
 *     console.log(array); // [1, 4, 2]
 *     console.log(order); // [1, 4, 2]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       result.push(num);
 *       return num !== 4;
 *     });
 * };
 * Aigle.transformSeries(collection, iterator, [])
 *   .then(array => {
 *     console.log(array); // [1, 4]
 *     console.log(order); // [1, 4]
 *   });
 */
function transformSeries(collection, iterator, accumulator) {
  return new TransformSeries(collection, iterator, accumulator)._execute();
}

},{"./eachSeries":15,"./internal/collection":37,"./internal/util":40}],83:[function(require,module,exports){
'use strict';

const { AigleWhilst, WhilstTester } = require('./whilst');

class UntilTester extends WhilstTester {
  constructor(tester) {
    super(tester);
  }

  _callResolve(value) {
    if (value) {
      this._proxy._promise._resolve(this._value);
    } else {
      this._proxy._next(this._value);
    }
  }
}

module.exports = { until, UntilTester };

/**
 * @param {*} [value]
 * @param {Function} tester
 * @param {Function} iterator
 */
function until(value, tester, iterator) {
  if (typeof iterator !== 'function') {
    iterator = tester;
    tester = value;
    value = undefined;
  }
  return new AigleWhilst(new UntilTester(tester), iterator)._iterate(value);
}

},{"./whilst":85}],84:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, apply, call1, callProxyReciever } = require('./internal/util');

const DISPOSER = {};

class Disposer {
  constructor(promise, handler) {
    this._promise = promise;
    this._handler = handler;
  }

  _dispose() {
    const { _promise } = this;
    switch (_promise._resolved) {
      case 0:
        return _promise.then(() => this._dispose());
      case 1:
        return call1(this._handler, this._promise._value);
    }
  }
}

class Using extends AigleProxy {
  constructor(array, handler) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._disposed = size;
    this._array = array;
    this._error = undefined;
    this._result = Array(size);
    this._handler = handler;
    let i = -1;
    while (++i < size) {
      const disposer = array[i];
      if (disposer instanceof Disposer === false) {
        callProxyReciever(disposer, this, i);
      } else {
        callProxyReciever(disposer._promise, this, i);
      }
    }
  }

  _spread() {
    const { _handler, _result } = this;
    if (typeof _handler !== 'function') {
      return this._callResolve(undefined, INTERNAL);
    }
    callProxyReciever(apply(_handler, _result), this, INTERNAL);
  }

  _release() {
    const { _array } = this;
    let l = _array.length;
    while (l--) {
      const disposer = _array[l];
      if (disposer instanceof Disposer === false) {
        this._callResolve(disposer, DISPOSER);
      } else {
        callProxyReciever(disposer._dispose(), this, DISPOSER);
      }
    }
  }

  _callResolve(value, index) {
    if (index === INTERNAL) {
      this._result = value;
      return this._release();
    }
    if (index === DISPOSER) {
      if (--this._disposed === 0) {
        if (this._error) {
          this._promise._reject(this._error);
        } else {
          this._promise._resolve(this._result);
        }
      }
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._spread();
    }
  }

  _callReject(reason) {
    if (this._error) {
      return this._promise._reject(reason);
    }
    this._error = reason;
    this._release();
  }
}

module.exports = { using, Disposer };

function using() {
  let l = arguments.length;
  const handler = arguments[--l];
  const array = Array(l);
  while (l--) {
    array[l] = arguments[l];
  }
  return new Using(array, handler)._promise;
}

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],85:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');

const Aigle = require('./aigle');
const { INTERNAL, callProxyReciever, call1 } = require('./internal/util');

class WhilstTester extends AigleProxy {
  constructor(tester) {
    super();
    this._tester = tester;
    this._proxy = undefined;
    this._value = undefined;
  }

  _test(value) {
    this._value = value;
    callProxyReciever(call1(this._tester, value), this, undefined);
  }

  _callResolve(value) {
    if (value) {
      this._proxy._next(this._value);
    } else {
      this._proxy._promise._resolve(this._value);
    }
  }

  _callReject(reason) {
    this._proxy._callReject(reason);
  }
}

class AigleWhilst extends AigleProxy {
  constructor(tester, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._tester = tester;
    this._iterator = iterator;
    tester._proxy = this;
  }

  _iterate(value) {
    this._callResolve(value);
    return this._promise;
  }

  _next(value) {
    callProxyReciever(call1(this._iterator, value), this, undefined);
  }

  _callResolve(value) {
    this._tester._test(value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { whilst, AigleWhilst, WhilstTester };

/**
 * @param {*} [value]
 * @param {Function} tester
 * @param {Function} iterator
 */
function whilst(value, tester, iterator) {
  if (typeof iterator !== 'function') {
    iterator = tester;
    tester = value;
    value = undefined;
  }
  return new AigleWhilst(new WhilstTester(tester), iterator)._iterate(value);
}

},{"./aigle":2,"./internal/util":40,"aigle-core":86}],86:[function(require,module,exports){
'use strict';

class AigleCore {
  constructor() {}
}

class AigleProxy {
  constructor() {}
}

module.exports = { AigleCore, AigleProxy };

},{}],87:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],88:[function(require,module,exports){
(function (process,global){
(function (global, undefined) {
    "use strict";

    if (global.setImmediate) {
        return;
    }

    var nextHandle = 1; // Spec says greater than zero
    var tasksByHandle = {};
    var currentlyRunningATask = false;
    var doc = global.document;
    var registerImmediate;

    function setImmediate(callback) {
      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
      }
      // Copy function arguments
      var args = new Array(arguments.length - 1);
      for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i + 1];
      }
      // Store and register the task
      var task = { callback: callback, args: args };
      tasksByHandle[nextHandle] = task;
      registerImmediate(nextHandle);
      return nextHandle++;
    }

    function clearImmediate(handle) {
        delete tasksByHandle[handle];
    }

    function run(task) {
        var callback = task.callback;
        var args = task.args;
        switch (args.length) {
        case 0:
            callback();
            break;
        case 1:
            callback(args[0]);
            break;
        case 2:
            callback(args[0], args[1]);
            break;
        case 3:
            callback(args[0], args[1], args[2]);
            break;
        default:
            callback.apply(undefined, args);
            break;
        }
    }

    function runIfPresent(handle) {
        // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
        // So if we're currently running a task, we'll need to delay this invocation.
        if (currentlyRunningATask) {
            // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
            // "too much recursion" error.
            setTimeout(runIfPresent, 0, handle);
        } else {
            var task = tasksByHandle[handle];
            if (task) {
                currentlyRunningATask = true;
                try {
                    run(task);
                } finally {
                    clearImmediate(handle);
                    currentlyRunningATask = false;
                }
            }
        }
    }

    function installNextTickImplementation() {
        registerImmediate = function(handle) {
            process.nextTick(function () { runIfPresent(handle); });
        };
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.
        if (global.postMessage && !global.importScripts) {
            var postMessageIsAsynchronous = true;
            var oldOnMessage = global.onmessage;
            global.onmessage = function() {
                postMessageIsAsynchronous = false;
            };
            global.postMessage("", "*");
            global.onmessage = oldOnMessage;
            return postMessageIsAsynchronous;
        }
    }

    function installPostMessageImplementation() {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var messagePrefix = "setImmediate$" + Math.random() + "$";
        var onGlobalMessage = function(event) {
            if (event.source === global &&
                typeof event.data === "string" &&
                event.data.indexOf(messagePrefix) === 0) {
                runIfPresent(+event.data.slice(messagePrefix.length));
            }
        };

        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        registerImmediate = function(handle) {
            global.postMessage(messagePrefix + handle, "*");
        };
    }

    function installMessageChannelImplementation() {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(event) {
            var handle = event.data;
            runIfPresent(handle);
        };

        registerImmediate = function(handle) {
            channel.port2.postMessage(handle);
        };
    }

    function installReadyStateChangeImplementation() {
        var html = doc.documentElement;
        registerImmediate = function(handle) {
            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var script = doc.createElement("script");
            script.onreadystatechange = function () {
                runIfPresent(handle);
                script.onreadystatechange = null;
                html.removeChild(script);
                script = null;
            };
            html.appendChild(script);
        };
    }

    function installSetTimeoutImplementation() {
        registerImmediate = function(handle) {
            setTimeout(runIfPresent, 0, handle);
        };
    }

    // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
    var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
    attachTo = attachTo && attachTo.setTimeout ? attachTo : global;

    // Don't get fooled by e.g. browserify environments.
    if ({}.toString.call(global.process) === "[object process]") {
        // For Node.js before 0.9
        installNextTickImplementation();

    } else if (canUsePostMessage()) {
        // For non-IE10 modern browsers
        installPostMessageImplementation();

    } else if (global.MessageChannel) {
        // For web workers, where supported
        installMessageChannelImplementation();

    } else if (doc && "onreadystatechange" in doc.createElement("script")) {
        // For IE 6–8
        installReadyStateChangeImplementation();

    } else {
        // For older browsers
        installSetTimeoutImplementation();
    }

    attachTo.setImmediate = setImmediate;
    attachTo.clearImmediate = clearImmediate;
}(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self));

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":87}],89:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":87,"timers":89}],90:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],91:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],92:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":91,"_process":87,"inherits":90}],93:[function(require,module,exports){
module.exports={
  "name": "aigle",
  "version": "1.15.0-alpha.0",
  "description": "Aigle is an ideal Promise library, faster and more functional than other Promise libraries",
  "main": "index.js",
  "typings": "aigle.d.ts",
  "private": true,
  "browser": "browser.js",
  "scripts": {
    "start:doc": "cd website && npm start",
    "build": "npm-run-all build:*",
    "build:lib": "gulp build",
    "build:type": "typeg typings/aigle-base.d.ts --out typings/aigle.d.ts",
    "bench": "node --expose_gc ./benchmark -d",
    "eslint": "eslint . --ext .js",
    "test": "DELAY=50 npm-run-all -p eslint test:type test:cov",
    "test:mocha": "mocha test/**/*.js",
    "test:cov": "nyc npm run test:mocha",
    "test:type": "cd typings && tsc",
    "codecov": "nyc report --reporter=lcovonly && codecov",
    "lint-staged": "lint-staged",
    "prettier": "prettier --write './benchmark/**/*.js' './gulp/**/*.js' './lib/**/*.js' './test/**/*.js' './typings/**/*.ts'"
  },
  "homepage": "https://github.com/suguru03/aigle",
  "keywords": [
    "aigle",
    "promise",
    "async"
  ],
  "files": [
    "README.md",
    "index.js",
    "lib/",
    "browser.js",
    "dist/"
  ],
  "author": "Suguru Motegi",
  "license": "MIT",
  "devDependencies": {
    "async": "^3.1.0",
    "babili": "0.1.4",
    "benchmark": "^2.1.1",
    "bluebird": "^3.5.3",
    "browserify": "^16.2.3",
    "buble": "^0.20.0",
    "codecov": "^3.6.5",
    "docdash": "^1.0.0",
    "eslint": "^6.7.1",
    "fs-extra": "^9.0.0",
    "gulp": "^4.0.0",
    "gulp-bump": "^3.0.0",
    "gulp-git": "^2.8.1",
    "gulp-tag-version": "^1.3.0",
    "husky": "^4.2.5",
    "jsdoc": "^3.5.5",
    "lint-staged": "^10.1.3",
    "lodash": "^4.15.0",
    "minimist": "^1.2.0",
    "mocha": "^7.0.1",
    "mocha.parallel": "0.15.6",
    "neo-async": "^2.6.0",
    "npm-run-all": "^4.1.5",
    "nyc": "^15.0.0",
    "prettier": "^2.0.4",
    "require-dir": "^1.0.0",
    "semver": "^7.0.0",
    "setimmediate": "^1.0.5",
    "tslint": "^5.11.0",
    "typeg": "^0.2.2",
    "typescript": "^3.8.3",
    "uglify-js": "^3.9.0"
  },
  "dependencies": {
    "aigle-core": "^1.0.0"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm-run-all -p build:type lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,ts}": [
      "prettier --write",
      "git add typings"
    ]
  },
  "prettier": {
    "printWidth": 100,
    "singleQuote": true
  }
}

},{}]},{},[1])(1)
});
