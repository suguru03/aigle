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
  printWarning
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
    return this.then(value => whilst(value, tester, iterator));
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
    return this.then(value => doWhilst(value, iterator, tester));
  }

  /**
   * @param {Function} tester
   * @param {Function} iterator
   */
  until(tester, iterator) {
    return this.then(value => until(value, tester, iterator));
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
    return this.then(value => doUntil(value, iterator, tester));
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
    return this.then(value => thru(value, onFulfilled));
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
    return this.then(value => tap(value, onFulfilled));
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
      value => {
        if (executor === undefined) {
          return;
        }
        executor = undefined;
        callReceiver(this, value);
      },
      reason => {
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
      value => {
        if (executor === undefined) {
          return;
        }
        if (value instanceof Aigle && value._resolved === 0) {
          this._parent = value;
        }
        executor = undefined;
        callReceiver(this, value);
      },
      reason => {
        if (executor === undefined) {
          return;
        }
        executor = undefined;
        this._reject(reason);
      },
      handler => {
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
  return reason => {
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
      p.then(() => receiver._resolve(_value), reason => receiver._reject(reason));
    } else {
      p.then(() => receiver._reject(_value), reason => receiver._reject(reason));
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
  Object.getOwnPropertyNames(sources).forEach(key => {
    const func = sources[key];
    if (typeof func !== 'function' || (Aigle[key] && !override)) {
      return;
    }
    // check lodash chain
    if (key === 'chain') {
      const obj = func();
      if (obj && obj.__chain__) {
        Aigle.chain = _resolve;
        Aigle.prototype.value = function() {
          return this;
        };
        return;
      }
    }
    const Proxy = createProxy(func, promisify);
    Aigle[key] = function(value, arg1, arg2, arg3) {
      return new Proxy(value, arg1, arg2, arg3)._execute();
    };
    Aigle.prototype[key] = function(arg1, arg2, arg3) {
      return addProxy(this, Proxy, arg1, arg2, arg3);
    };
  });
  return Aigle;
}
