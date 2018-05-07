(function(f) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = f();
  } else if (typeof define === 'function' && define.amd) {
    define([], f);
  } else {
    var g;
    if (typeof window !== 'undefined') {
      g = window;
    } else if (typeof global !== 'undefined') {
      g = global;
    } else if (typeof self !== 'undefined') {
      g = self;
    } else {
      g = this;
    }
    g.Promise = f();
  }
})(function() {
  var define, module, exports;
  return (function() {
    function r(e, n, t) {
      function o(i, f) {
        if (!n[i]) {
          if (!e[i]) {
            var c = 'function' == typeof require && require;
            if (!f && c) {
              return c(i, !0);
            }
            if (u) {
              return u(i, !0);
            }
            var a = new Error("Cannot find module '" + i + "'");
            throw ((a.code = 'MODULE_NOT_FOUND'), a);
          }
          var p = (n[i] = { exports: {} });
          e[i][0].call(
            p.exports,
            function(r) {
              var n = e[i][1][r];
              return o(n || r);
            },
            p,
            p.exports,
            r,
            e,
            n,
            t
          );
        }
        return n[i].exports;
      }
      for (var u = 'function' == typeof require && require, i = 0; i < t.length; i++) {
        o(t[i]);
      }
      return o;
    }
    return r;
  })()(
    {
      1: [
        function(require, module, exports) {
          'use strict';

          require('setimmediate');
          module.exports = require('./lib/aigle');
        },
        { './lib/aigle': 2, setimmediate: 84 }
      ],
      2: [
        function(require, module, exports) {
          (function(process) {
            'use strict';

            var ref = require('aigle-core');
            var AigleCore = ref.AigleCore;
            var AigleProxy = ref.AigleProxy;

            var Queue = require('./internal/queue');
            var invokeAsync = require('./internal/async');
            var ref$1 = require('./internal/util');
            var VERSION = ref$1.VERSION;
            var INTERNAL = ref$1.INTERNAL;
            var PENDING = ref$1.PENDING;
            var UNHANDLED = ref$1.UNHANDLED;
            var errorObj = ref$1.errorObj;
            var call0 = ref$1.call0;
            var callResolve = ref$1.callResolve;
            var callReject = ref$1.callReject;
            var callReceiver = ref$1.callReceiver;
            var stackTraces = false;

            var Aigle = (function(AigleCore) {
              function Aigle(executor) {
                AigleCore.call(this);
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

              if (AigleCore) Aigle.__proto__ = AigleCore;
              Aigle.prototype = Object.create(AigleCore && AigleCore.prototype);
              Aigle.prototype.constructor = Aigle;

              /**
               * @param {Function} onFulfilled
               * @param {Function} [onRejected]
               * @return {Aigle} Returns an Aigle instance
               */
              Aigle.prototype.then = function then(onFulfilled, onRejected) {
                return addAigle(this, new Aigle(INTERNAL), onFulfilled, onRejected);
              };

              /**
               * @param {Object|Function} onRejected
               * @return {Aigle} Returns an Aigle instance
               * @example
               * return Aigle.reject(new TypeError('error'))
               *   .catch(TypeError, error => console.log(error));
               */
              Aigle.prototype.catch = function catch$1(onRejected) {
                var arguments$1 = arguments;

                if (arguments.length > 1) {
                  var l = arguments.length;
                  onRejected = arguments[--l];
                  if (typeof onRejected === 'function') {
                    var errorTypes = Array(l);
                    while (l--) {
                      errorTypes[l] = arguments$1[l];
                    }
                    onRejected = createOnRejected(errorTypes, onRejected);
                  }
                }
                return addAigle(this, new Aigle(INTERNAL), undefined, onRejected);
              };

              /**
               * @param {Function} handler
               * @return {Aigle} Returns an Aigle instance
               */
              Aigle.prototype.finally = function finally$1(handler) {
                handler = typeof handler !== 'function' ? handler : createFinallyHandler(this, handler);
                return addAigle(this, new Aigle(INTERNAL), handler, handler);
              };

              /**
               * @return {string}
               */
              Aigle.prototype.toString = function toString() {
                return '[object Promise]';
              };

              /**
               * @return {boolean}
               */
              Aigle.prototype.isPending = function isPending() {
                return this._resolved === 0;
              };

              /**
               * @return {boolean}
               */
              Aigle.prototype.isFulfilled = function isFulfilled() {
                return this._resolved === 1;
              };

              /**
               * @return {boolean}
               */
              Aigle.prototype.isRejected = function isRejected() {
                return this._resolved === 2;
              };

              /**
               * @return {boolean}
               */
              Aigle.prototype.isCancelled = function isCancelled() {
                return this._value instanceof CancellationError;
              };

              /**
               * @return {*}
               */
              Aigle.prototype.value = function value() {
                return this._resolved === 1 ? this._value : undefined;
              };

              /**
               * @return {*}
               */
              Aigle.prototype.reason = function reason() {
                return this._resolved === 2 ? this._value : undefined;
              };

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
              Aigle.prototype.cancel = function cancel() {
                if (this._execute === execute || this._resolved !== 0) {
                  return;
                }
                var ref = this;
                var _onCancelQueue = ref._onCancelQueue;
                if (_onCancelQueue) {
                  var i = -1;
                  var array = _onCancelQueue.array;
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
              };

              Aigle.prototype.suppressUnhandledRejections = function suppressUnhandledRejections() {
                this._receiver = INTERNAL;
              };

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
              Aigle.prototype.spread = function spread(handler) {
                return addReceiver(this, new Spread(handler));
              };

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
              Aigle.prototype.all = function all() {
                return addProxy(this, All);
              };

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
              Aigle.prototype.race = function race() {
                return addProxy(this, Race);
              };

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
              Aigle.prototype.props = function props() {
                return addProxy(this, Props);
              };

              /**
               * `Aigle#parallel` will execute [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel) using a previous promise value.
               * The value will be assigned as the first argument to [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel).
               * @param {Array|Object} collection - it should be an array of object of Promise instances
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
               * .parallel()
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
               * Aigle.resolve({
               *   a: makeDelay(1, 30),
               *   b: makeDelay(2, 20),
               *   c: makeDelay(3, 10)
               * })
               * .parallel()
               * .then(object => {
               *   console.log(object); // { a: 1, b: 2, c: 3 }
               *   console.log(order); // [3, 2, 1]
               * });
               */
              Aigle.prototype.parallel = function parallel() {
                return addProxy(this, Parallel);
              };

              /**
               * `Aigle#each` will execute [`Aigle.each`](https://suguru03.github.io/aigle/docs/global.html#each) using a previous promise value and a defined iterator.
               * The value will be assigned as the first argument to [`Aigle.each`](https://suguru03.github.io/aigle/docs/global.html#each) and
               * the iterator will be assigned as the second argument.
               * @param {Function} iterator
               * @example
               * const order = [];
               * const collection = [1, 4, 2];
               * const iterator = (num, value, collection) => {
               *   return Aigle.delay(num * 10)
               *     .then(() => order.push(num));
               * };
               * Aigle.resolve(collection)
               *   .each(iterator)
               *   .then(value => {
               *     console.log(value); // undefined
               *     console.log(order); // [1, 2, 4];
               *   });
               *
               * @example
               * const order = [];
               * const collection = { a: 1, b: 4, c: 2 };
               * const iterator = (num, key, collection) => {
               *   return Aigle.delay(num * 10)
               *     .then(() => order.push(num));
               * };
               * Aigle.resolve(collection)
               *   .each(iterator)
               *   .then(value => {
               *     console.log(value); // undefined
               *     console.log(order); // [1, 2, 4];
               *   });
               *
               * @example
               * const order = [];
               * const collection = [1, 4, 2];
               * const iterator = (num, value, collection) => {
               *   return Aigle.delay(num * 10)
               *     .then(() => {
               *       order.push(num);
               *       return num !== 2; // break
               *     });
               * };
               * Aigle.resolve(collection)
               *   .each(iterator)
               *   .then(value => {
               *     console.log(value); // undefined
               *     console.log(order); // [1, 2];
               *   });
               */
              Aigle.prototype.each = function each(iterator) {
                return addProxy(this, Each, iterator);
              };

              /**
               * @alias each
               * @param {Function} iterator
               */
              Aigle.prototype.forEach = function forEach(iterator) {
                return addProxy(this, Each, iterator);
              };

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
              Aigle.prototype.eachSeries = function eachSeries(iterator) {
                return addProxy(this, EachSeries, iterator);
              };

              /**
               * @alias eachSeries
               * @param {Function} iterator
               */
              Aigle.prototype.forEachSeries = function forEachSeries(iterator) {
                return addProxy(this, EachSeries, iterator);
              };

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
              Aigle.prototype.eachLimit = function eachLimit(limit, iterator) {
                return addProxy(this, EachLimit, limit, iterator);
              };

              /**
               * @alias eachLimit
               * @param {number} [limit=8]
               * @param {Function} iterator
               */
              Aigle.prototype.forEachLimit = function forEachLimit(limit, iterator) {
                return addProxy(this, EachLimit, limit, iterator);
              };

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
              Aigle.prototype.map = function map(iterator) {
                return addProxy(this, Map, iterator);
              };

              /**
               * `Aigle#mapSeries` is almost the same as [`Aigle#map`](https://suguru03.github.io/aigle/docs/global.html#map), but it will work in series.
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
              Aigle.prototype.mapSeries = function mapSeries(iterator) {
                return addProxy(this, MapSeries, iterator);
              };

              /**
               * `Aigle#mapLimit` is almost the same as [`Aigle#map`](https://suguru03.github.io/aigle/docs/global.html#map)
               * and [`Aigle#mapSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#mapSeries)), but it will work with concurrency.
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
              Aigle.prototype.mapLimit = function mapLimit(limit, iterator) {
                return addProxy(this, MapLimit, limit, iterator);
              };

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
              Aigle.prototype.mapValues = function mapValues(iterator) {
                return addProxy(this, MapValues, iterator);
              };

              /**
               * `Aigle#mapValuesSeries` is almost the same as [`Aigle#mapValues`](https://suguru03.github.io/aigle/docs/global.html#mapValues), but it will work in series.
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
              Aigle.prototype.mapValuesSeries = function mapValuesSeries(iterator) {
                return addProxy(this, MapValuesSeries, iterator);
              };

              /**
               * `Aigle#mapValuesLimit` is almost the same as [`Aigle#mapValues`](https://suguru03.github.io/aigle/docs/global.html#mapValues)
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
              Aigle.prototype.mapValuesLimit = function mapValuesLimit(limit, iterator) {
                return addProxy(this, MapValuesLimit, limit, iterator);
              };

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
              Aigle.prototype.filter = function filter(iterator) {
                return addProxy(this, Filter, iterator);
              };

              /**
               * `Aigle#filterSeries` is almost the same as [`Aigle#filter`](https://suguru03.github.io/aigle/docs/global.html#filter), but it will work in series.
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
              Aigle.prototype.filterSeries = function filterSeries(iterator) {
                return addProxy(this, FilterSeries, iterator);
              };

              /**
               * `Aigle#filterLimit` is almost the same as [`Aigle#filter`](https://suguru03.github.io/aigle/docs/global.html#filter)
               * and [`Aigle#filterSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#filterSeries)), but it will work with concurrency.
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
              Aigle.prototype.filterLimit = function filterLimit(limit, iterator) {
                return addProxy(this, FilterLimit, limit, iterator);
              };

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
              Aigle.prototype.reject = function reject(iterator) {
                return addProxy(this, Reject, iterator);
              };

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
              Aigle.prototype.rejectSeries = function rejectSeries(iterator) {
                return addProxy(this, RejectSeries, iterator);
              };

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
              Aigle.prototype.rejectLimit = function rejectLimit(limit, iterator) {
                return addProxy(this, RejectLimit, limit, iterator);
              };

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
              Aigle.prototype.find = function find(iterator) {
                return addProxy(this, Find, iterator);
              };

              /**
               * `Aigle#findSeries` is almost the same as [`Aigle#find`](https://suguru03.github.io/aigle/docs/global.html#find), but it will work in series.
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
              Aigle.prototype.findSeries = function findSeries(iterator) {
                return addProxy(this, FindSeries, iterator);
              };

              /**
               * `Aigle#findLimit` is almost the same as [`Aigle#find`](https://suguru03.github.io/aigle/docs/global.html#find)
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
              Aigle.prototype.findLimit = function findLimit(limit, iterator) {
                return addProxy(this, FindLimit, limit, iterator);
              };

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
              Aigle.prototype.findIndex = function findIndex(iterator) {
                return addProxy(this, FindIndex, iterator);
              };

              /**
               * `Aigle#findIndexSeries` is almost the same as [`Aigle#findIndex`](https://suguru03.github.io/aigle/docs/global.html#findIndex), but it will work in series.
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
              Aigle.prototype.findIndexSeries = function findIndexSeries(iterator) {
                return addProxy(this, FindIndexSeries, iterator);
              };

              /**
               * `Aigle#findIndexLimit` is almost the same as [`Aigle#findIndex`](https://suguru03.github.io/aigle/docs/global.html#findIndex)
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
              Aigle.prototype.findIndexLimit = function findIndexLimit(limit, iterator) {
                return addProxy(this, FindIndexLimit, limit, iterator);
              };

              /**
               * @param {Function} iterator
               * @return {Aigle} Returns an Aigle instance
               */
              Aigle.prototype.findKey = function findKey(iterator) {
                return addProxy(this, FindKey, iterator);
              };

              /**
               * @param {Function} iterator
               * @return {Aigle} Returns an Aigle instance
               */
              Aigle.prototype.findKeySeries = function findKeySeries(iterator) {
                return addProxy(this, FindKeySeries, iterator);
              };

              /**
               * @param {integer} [limit=8]
               * @param {Function} iterator
               * @return {Aigle} Returns an Aigle instance
               */
              Aigle.prototype.findKeyLimit = function findKeyLimit(limit, iterator) {
                return addProxy(this, FindKeyLimit, limit, iterator);
              };

              /**
               * @param {*} iterator
               * @param {*} [args]
               * @return {Aigle} Returns an Aigle instance
               */
              Aigle.prototype.pick = function pick(iterator) {
                var args = [],
                  len = arguments.length - 1;
                while (len-- > 0) args[len] = arguments[len + 1];

                return addProxy(this, Pick, iterator, args);
              };

              /**
               * @alias pickBySeries
               * @param {Function} iterator
               */
              Aigle.prototype.pickSeries = function pickSeries(iterator) {
                return this.pickBySeries(iterator);
              };

              /**
               * @alias pickByLimit
               * @param {number} [limit=8]
               * @param {Function} iterator
               */
              Aigle.prototype.pickLimit = function pickLimit(limit, iterator) {
                return this.pickByLimit(limit, iterator);
              };

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
              Aigle.prototype.pickBy = function pickBy(iterator) {
                return addProxy(this, PickBy, iterator);
              };

              /**
               * `Aigle#pickBySeries` is almost the same as [`Aigle#pickBy`](https://suguru03.github.io/aigle/docs/global.html#pickBy), but it will work in series.
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
              Aigle.prototype.pickBySeries = function pickBySeries(iterator) {
                return addProxy(this, PickBySeries, iterator);
              };

              /**
               * `Aigle#pickByLimit` is almost the same as [`Aigle#pickBy`](https://suguru03.github.io/aigle/docs/global.html#pickBy)
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
              Aigle.prototype.pickByLimit = function pickByLimit(limit, iterator) {
                return addProxy(this, PickByLimit, limit, iterator);
              };

              /**
               * @param {*} iterator
               * @param {*} [args]
               * @return {Aigle} Returns an Aigle instance
               */
              Aigle.prototype.omit = function omit(iterator) {
                var args = [],
                  len = arguments.length - 1;
                while (len-- > 0) args[len] = arguments[len + 1];

                return addProxy(this, Omit, iterator, args);
              };

              /**
               * @alias omitBySeries
               * @param {Function} iterator
               */
              Aigle.prototype.omitSeries = function omitSeries(iterator) {
                return this.omitBySeries(iterator);
              };

              /**
               * @alias omitByLimit
               * @param {number} [limit=8]
               * @param {Function} iterator
               */
              Aigle.prototype.omitLimit = function omitLimit(limit, iterator) {
                return this.omitByLimit(limit, iterator);
              };

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
              Aigle.prototype.omitBy = function omitBy(iterator) {
                return addProxy(this, OmitBy, iterator);
              };

              /**
               * `Aigle#omitBySeries` is almost the same as [`Aigle#omitBy`](https://suguru03.github.io/aigle/docs/global.html#omitBy), but it will work in series.
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
              Aigle.prototype.omitBySeries = function omitBySeries(iterator) {
                return addProxy(this, OmitBySeries, iterator);
              };

              /**
               * `Aigle#omitByLimit` is almost the same as [`Aigle#omitBy`](https://suguru03.github.io/aigle/docs/global.html#omitBy)
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
              Aigle.prototype.omitByLimit = function omitByLimit(limit, iterator) {
                return addProxy(this, OmitByLimit, limit, iterator);
              };

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
              Aigle.prototype.reduce = function reduce(iterator, result) {
                return addProxy(this, Reduce, iterator, result);
              };

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
              Aigle.prototype.transform = function transform(iterator, accumulator) {
                return addProxy(this, Transform, iterator, accumulator);
              };

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
              Aigle.prototype.transformSeries = function transformSeries(iterator, accumulator) {
                return addProxy(this, TransformSeries, iterator, accumulator);
              };

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
              Aigle.prototype.transformLimit = function transformLimit(limit, iterator, accumulator) {
                return addProxy(this, TransformLimit, limit, iterator, accumulator);
              };

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
              Aigle.prototype.sortBy = function sortBy(iterator) {
                return addProxy(this, SortBy, iterator);
              };

              /**
               * `Aigle#sortBySeries` is almost the same as [`Aigle#sortBy`](https://suguru03.github.io/aigle/docs/global.html#sortBy), but it will work in series.
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
              Aigle.prototype.sortBySeries = function sortBySeries(iterator) {
                return addProxy(this, SortBySeries, iterator);
              };

              /**
               * `Aigle#sortByLimit` is almost the same as [`Aigle#sortBy`](https://suguru03.github.io/aigle/docs/global.html#sortBy)
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
              Aigle.prototype.sortByLimit = function sortByLimit(limit, iterator) {
                return addProxy(this, SortByLimit, limit, iterator);
              };

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
              Aigle.prototype.some = function some(iterator) {
                return addProxy(this, Some, iterator);
              };

              /**
               * `Aigle#someSeries` is almost the same as [`Aigle#some`](https://suguru03.github.io/aigle/docs/global.html#some), but it will work in series.
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
              Aigle.prototype.someSeries = function someSeries(iterator) {
                return addProxy(this, SomeSeries, iterator);
              };

              /**
               * `Aigle#someLimit` is almost the same as [`Aigle#some`](https://suguru03.github.io/aigle/docs/global.html#some)
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
              Aigle.prototype.someLimit = function someLimit(limit, iterator) {
                return addProxy(this, SomeLimit, limit, iterator);
              };

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
              Aigle.prototype.every = function every(iterator) {
                return addProxy(this, Every, iterator);
              };

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
              Aigle.prototype.everySeries = function everySeries(iterator) {
                return addProxy(this, EverySeries, iterator);
              };

              /**
               * `Aigle#everyLimit` is almost the same as [`Aigle.every`](https://suguru03.github.io/aigle/docs/Aigle.html#every) and
               * [`Aigle.everySeries`](https://suguru03.github.io/aigle/docs/Aigle.html#everySeries), but it will work with concurrency.
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
              Aigle.prototype.everyLimit = function everyLimit(limit, iterator) {
                return addProxy(this, EveryLimit, limit, iterator);
              };

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
              Aigle.prototype.concat = function concat(iterator) {
                return addProxy(this, Concat, iterator);
              };

              /**
               * `Aigle#concatSeries` is almost the same as [`Aigle#concat`](https://suguru03.github.io/aigle/docs/global.html#concat), but it will work in series.
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
              Aigle.prototype.concatSeries = function concatSeries(iterator) {
                return addProxy(this, ConcatSeries, iterator);
              };

              /**
               * `Aigle#concatLimit` is almost the same as [`Aigle#concat`](https://suguru03.github.io/aigle/docs/global.html#concat)
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
              Aigle.prototype.concatLimit = function concatLimit(limit, iterator) {
                return addProxy(this, ConcatLimit, limit, iterator);
              };

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
              Aigle.prototype.groupBy = function groupBy(iterator) {
                return addProxy(this, GroupBy, iterator);
              };

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
              Aigle.prototype.groupBySeries = function groupBySeries(iterator) {
                return addProxy(this, GroupBySeries, iterator);
              };

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
              Aigle.prototype.groupByLimit = function groupByLimit(limit, iterator) {
                return addProxy(this, GroupByLimit, limit, iterator);
              };

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
              Aigle.prototype.delay = function delay(ms) {
                return addAigle(this, new Delay(ms));
              };

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
              Aigle.prototype.timeout = function timeout(ms, message) {
                return addReceiver(this, new Timeout(ms, message));
              };

              /**
               * @param {Function} tester
               * @param {Function} iterator
               */
              Aigle.prototype.whilst = function whilst$1(tester, iterator) {
                return this.then(function(value) {
                  return whilst(value, tester, iterator);
                });
              };

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
              Aigle.prototype.doWhilst = function doWhilst$1(iterator, tester) {
                return this.then(function(value) {
                  return doWhilst(value, iterator, tester);
                });
              };

              /**
               * @param {Function} tester
               * @param {Function} iterator
               */
              Aigle.prototype.until = function until$1(tester, iterator) {
                return this.then(function(value) {
                  return until(value, tester, iterator);
                });
              };

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
              Aigle.prototype.doUntil = function doUntil$1(iterator, tester) {
                return this.then(function(value) {
                  return doUntil(value, iterator, tester);
                });
              };

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
              Aigle.prototype.thru = function thru$1(onFulfilled) {
                return this.then(function(value) {
                  return thru(value, onFulfilled);
                });
              };

              /**
               * @param {Function} onFulfilled
               * @return {Aigle} Returns an Aigle instance
               * @example
               * Aigle.resolve([1, 4, 2])
               *   .tap(array => array.pop()
               *   .then(array => {
               *     console.log(array); // [1, 4]
               *   });
               */
              Aigle.prototype.tap = function tap$1(onFulfilled) {
                return this.then(function(value) {
                  return tap(value, onFulfilled);
                });
              };

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
              Aigle.prototype.times = function times(iterator) {
                return addProxy(this, Times, iterator);
              };

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
              Aigle.prototype.timesSeries = function timesSeries(iterator) {
                return addProxy(this, TimesSeries, iterator);
              };

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
              Aigle.prototype.timesLimit = function timesLimit(limit, iterator) {
                return addProxy(this, TimesLimit, limit, iterator);
              };

              /**
               * @param {Function} handler
               */
              Aigle.prototype.disposer = function disposer(handler) {
                return new Disposer(this, handler);
              };

              /* internal functions */

              Aigle.prototype._resolve = function _resolve(value) {
                if (this._resolved !== 0) {
                  return;
                }
                this._resolved = 1;
                this._value = value;
                if (this._receiver === undefined) {
                  return;
                }
                this._callResolve();
              };

              Aigle.prototype._callResolve = function _callResolve() {
                var ref = this;
                var _receiver = ref._receiver;
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
                var ref$1 = this;
                var _value = ref$1._value;
                var _key = ref$1._key;
                var _receivers = ref$1._receivers;
                this._receivers = undefined;
                var i = -1;
                var array = _receivers.array;
                while (++i < _receivers.length) {
                  var ref$2 = array[i];
                  var receiver = ref$2.receiver;
                  var onFulfilled = ref$2.onFulfilled;
                  if (receiver instanceof AigleProxy) {
                    receiver._callResolve(_value, _key);
                  } else {
                    callResolve(receiver, onFulfilled, _value);
                  }
                }
              };

              Aigle.prototype._reject = function _reject(reason) {
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
              };

              Aigle.prototype._callReject = function _callReject() {
                var ref = this;
                var _receiver = ref._receiver;
                this._receiver = undefined;
                if (_receiver === undefined || _receiver === UNHANDLED) {
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
                var ref$1 = this;
                var _value = ref$1._value;
                var _receivers = ref$1._receivers;
                this._receivers = undefined;
                var i = -1;
                var array = _receivers.array;
                while (++i < _receivers.length) {
                  var ref$2 = array[i];
                  var receiver = ref$2.receiver;
                  var onRejected = ref$2.onRejected;
                  if (receiver instanceof AigleProxy) {
                    receiver._callReject(_value);
                  } else {
                    callReject(receiver, onRejected, _value);
                  }
                }
              };

              Aigle.prototype._addReceiver = function _addReceiver(receiver, key) {
                this._key = key;
                this._receiver = receiver;
              };

              return Aigle;
            })(AigleCore);

            Aigle.prototype._execute = execute;

            module.exports = Aigle;
            module.exports.default = Aigle;

            /* functions, classes */
            var ref$2 = require('./all');
            var all = ref$2.all;
            var All = ref$2.All;
            var attempt = require('./attempt');
            var ref$3 = require('./race');
            var race = ref$3.race;
            var Race = ref$3.Race;
            var ref$4 = require('./props');
            var props = ref$4.props;
            var Props = ref$4.Props;
            var ref$5 = require('./parallel');
            var parallel = ref$5.parallel;
            var Parallel = ref$5.Parallel;
            var ref$6 = require('./each');
            var each = ref$6.each;
            var Each = ref$6.Each;
            var ref$7 = require('./eachSeries');
            var eachSeries = ref$7.eachSeries;
            var EachSeries = ref$7.EachSeries;
            var ref$8 = require('./eachLimit');
            var eachLimit = ref$8.eachLimit;
            var EachLimit = ref$8.EachLimit;
            var ref$9 = require('./map');
            var map = ref$9.map;
            var Map = ref$9.Map;
            var ref$10 = require('./mapSeries');
            var mapSeries = ref$10.mapSeries;
            var MapSeries = ref$10.MapSeries;
            var ref$11 = require('./mapLimit');
            var mapLimit = ref$11.mapLimit;
            var MapLimit = ref$11.MapLimit;
            var ref$12 = require('./mapValues');
            var mapValues = ref$12.mapValues;
            var MapValues = ref$12.MapValues;
            var ref$13 = require('./mapValuesSeries');
            var mapValuesSeries = ref$13.mapValuesSeries;
            var MapValuesSeries = ref$13.MapValuesSeries;
            var ref$14 = require('./mapValuesLimit');
            var mapValuesLimit = ref$14.mapValuesLimit;
            var MapValuesLimit = ref$14.MapValuesLimit;
            var ref$15 = require('./filter');
            var filter = ref$15.filter;
            var Filter = ref$15.Filter;
            var ref$16 = require('./filterSeries');
            var filterSeries = ref$16.filterSeries;
            var FilterSeries = ref$16.FilterSeries;
            var ref$17 = require('./filterLimit');
            var filterLimit = ref$17.filterLimit;
            var FilterLimit = ref$17.FilterLimit;
            var ref$18 = require('./reject');
            var reject = ref$18.reject;
            var Reject = ref$18.Reject;
            var ref$19 = require('./rejectSeries');
            var rejectSeries = ref$19.rejectSeries;
            var RejectSeries = ref$19.RejectSeries;
            var ref$20 = require('./rejectLimit');
            var rejectLimit = ref$20.rejectLimit;
            var RejectLimit = ref$20.RejectLimit;
            var ref$21 = require('./find');
            var find = ref$21.find;
            var Find = ref$21.Find;
            var ref$22 = require('./findSeries');
            var findSeries = ref$22.findSeries;
            var FindSeries = ref$22.FindSeries;
            var ref$23 = require('./findLimit');
            var findLimit = ref$23.findLimit;
            var FindLimit = ref$23.FindLimit;
            var ref$24 = require('./findIndex');
            var findIndex = ref$24.findIndex;
            var FindIndex = ref$24.FindIndex;
            var ref$25 = require('./findIndexSeries');
            var findIndexSeries = ref$25.findIndexSeries;
            var FindIndexSeries = ref$25.FindIndexSeries;
            var ref$26 = require('./findIndexLimit');
            var findIndexLimit = ref$26.findIndexLimit;
            var FindIndexLimit = ref$26.FindIndexLimit;
            var ref$27 = require('./findKey');
            var findKey = ref$27.findKey;
            var FindKey = ref$27.FindKey;
            var ref$28 = require('./findKeySeries');
            var findKeySeries = ref$28.findKeySeries;
            var FindKeySeries = ref$28.FindKeySeries;
            var ref$29 = require('./findKeyLimit');
            var findKeyLimit = ref$29.findKeyLimit;
            var FindKeyLimit = ref$29.FindKeyLimit;
            var ref$30 = require('./pick');
            var pick = ref$30.pick;
            var Pick = ref$30.Pick;
            var ref$31 = require('./pickBy');
            var pickBy = ref$31.pickBy;
            var PickBy = ref$31.PickBy;
            var ref$32 = require('./pickBySeries');
            var pickBySeries = ref$32.pickBySeries;
            var PickBySeries = ref$32.PickBySeries;
            var ref$33 = require('./pickByLimit');
            var pickByLimit = ref$33.pickByLimit;
            var PickByLimit = ref$33.PickByLimit;
            var ref$34 = require('./omit');
            var omit = ref$34.omit;
            var Omit = ref$34.Omit;
            var ref$35 = require('./omitBy');
            var omitBy = ref$35.omitBy;
            var OmitBy = ref$35.OmitBy;
            var ref$36 = require('./omitBySeries');
            var omitBySeries = ref$36.omitBySeries;
            var OmitBySeries = ref$36.OmitBySeries;
            var ref$37 = require('./omitByLimit');
            var omitByLimit = ref$37.omitByLimit;
            var OmitByLimit = ref$37.OmitByLimit;
            var ref$38 = require('./reduce');
            var reduce = ref$38.reduce;
            var Reduce = ref$38.Reduce;
            var ref$39 = require('./transform');
            var transform = ref$39.transform;
            var Transform = ref$39.Transform;
            var ref$40 = require('./transformSeries');
            var transformSeries = ref$40.transformSeries;
            var TransformSeries = ref$40.TransformSeries;
            var ref$41 = require('./transformLimit');
            var transformLimit = ref$41.transformLimit;
            var TransformLimit = ref$41.TransformLimit;
            var ref$42 = require('./sortBy');
            var sortBy = ref$42.sortBy;
            var SortBy = ref$42.SortBy;
            var ref$43 = require('./sortBySeries');
            var sortBySeries = ref$43.sortBySeries;
            var SortBySeries = ref$43.SortBySeries;
            var ref$44 = require('./sortByLimit');
            var sortByLimit = ref$44.sortByLimit;
            var SortByLimit = ref$44.SortByLimit;
            var ref$45 = require('./some');
            var some = ref$45.some;
            var Some = ref$45.Some;
            var ref$46 = require('./someSeries');
            var someSeries = ref$46.someSeries;
            var SomeSeries = ref$46.SomeSeries;
            var ref$47 = require('./someLimit');
            var someLimit = ref$47.someLimit;
            var SomeLimit = ref$47.SomeLimit;
            var ref$48 = require('./every');
            var every = ref$48.every;
            var Every = ref$48.Every;
            var ref$49 = require('./everySeries');
            var everySeries = ref$49.everySeries;
            var EverySeries = ref$49.EverySeries;
            var ref$50 = require('./everyLimit');
            var everyLimit = ref$50.everyLimit;
            var EveryLimit = ref$50.EveryLimit;
            var ref$51 = require('./concat');
            var concat = ref$51.concat;
            var Concat = ref$51.Concat;
            var ref$52 = require('./concatSeries');
            var concatSeries = ref$52.concatSeries;
            var ConcatSeries = ref$52.ConcatSeries;
            var ref$53 = require('./concatLimit');
            var concatLimit = ref$53.concatLimit;
            var ConcatLimit = ref$53.ConcatLimit;
            var ref$54 = require('./groupBy');
            var groupBy = ref$54.groupBy;
            var GroupBy = ref$54.GroupBy;
            var ref$55 = require('./groupBySeries');
            var groupBySeries = ref$55.groupBySeries;
            var GroupBySeries = ref$55.GroupBySeries;
            var ref$56 = require('./groupByLimit');
            var groupByLimit = ref$56.groupByLimit;
            var GroupByLimit = ref$56.GroupByLimit;
            var ref$57 = require('./join');
            var join = ref$57.join;
            var Spread = ref$57.Spread;
            var promisify = require('./promisify');
            var promisifyAll = require('./promisifyAll');
            var ref$58 = require('./delay');
            var delay = ref$58.delay;
            var Delay = ref$58.Delay;
            var Timeout = require('./timeout');
            var ref$59 = require('./whilst');
            var whilst = ref$59.whilst;
            var ref$60 = require('./doWhilst');
            var doWhilst = ref$60.doWhilst;
            var ref$61 = require('./until');
            var until = ref$61.until;
            var doUntil = require('./doUntil');
            var retry = require('./retry');
            var thru = require('./thru');
            var tap = require('./tap');
            var ref$62 = require('./times');
            var times = ref$62.times;
            var Times = ref$62.Times;
            var ref$63 = require('./timesSeries');
            var timesSeries = ref$63.timesSeries;
            var TimesSeries = ref$63.TimesSeries;
            var ref$64 = require('./timesLimit');
            var timesLimit = ref$64.timesLimit;
            var TimesLimit = ref$64.TimesLimit;
            var ref$65 = require('./using');
            var using = ref$65.using;
            var Disposer = ref$65.Disposer;
            var ref$66 = require('./debug');
            var resolveStack = ref$66.resolveStack;
            var reconstructStack = ref$66.reconstructStack;
            var ref$67 = require('./internal/mixin');
            var createProxy = ref$67.createProxy;

            Aigle.VERSION = VERSION;

            /* core functions */
            Aigle.resolve = _resolve;
            Aigle.reject = _reject;

            /* collections */
            Aigle.all = all;
            Aigle.race = race;
            Aigle.props = props;
            Aigle.parallel = parallel;
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
            Aigle.times = times;
            Aigle.timesSeries = timesSeries;
            Aigle.timesLimit = timesLimit;
            Aigle.using = using;
            Aigle.mixin = mixin;

            /* debug */
            Aigle.config = config;
            Aigle.longStackTraces = longStackTraces;

            /* errors */
            var ref$68 = require('./error');
            var CancellationError = ref$68.CancellationError;
            var TimeoutError = ref$68.TimeoutError;
            Aigle.CancellationError = CancellationError;
            Aigle.TimeoutError = TimeoutError;

            function _resolve(value) {
              if (value instanceof AigleCore) {
                return value;
              }
              var promise = new Aigle(INTERNAL);
              callReceiver(promise, value);
              return promise;
            }

            function _reject(reason, iterator) {
              if (arguments.length === 2 && typeof iterator === 'function') {
                return reject(reason, iterator);
              }
              var promise = new Aigle(INTERNAL);
              promise._reject(reason);
              return promise;
            }

            function execute(executor) {
              var this$1 = this;

              stackTraces && resolveStack(this);
              try {
                executor(
                  function(value) {
                    if (executor === undefined) {
                      return;
                    }
                    executor = undefined;
                    callReceiver(this$1, value);
                  },
                  function(reason) {
                    if (executor === undefined) {
                      return;
                    }
                    executor = undefined;
                    this$1._reject(reason);
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
              var this$1 = this;

              stackTraces && resolveStack(this);
              try {
                executor(
                  function(value) {
                    if (executor === undefined) {
                      return;
                    }
                    if (value instanceof Aigle && value._resolved === 0) {
                      this$1._parent = value;
                    }
                    executor = undefined;
                    callReceiver(this$1, value);
                  },
                  function(reason) {
                    if (executor === undefined) {
                      return;
                    }
                    executor = undefined;
                    this$1._reject(reason);
                  },
                  function(handler) {
                    if (typeof handler !== 'function') {
                      throw new TypeError('onCancel must be function');
                    }
                    if (this$1._resolved !== 0) {
                      return;
                    }
                    if (this$1._onCancelQueue === undefined) {
                      this$1._onCancelQueue = new Queue();
                    }
                    this$1._onCancelQueue.push(handler);
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
              return function(reason) {
                var l = errorTypes.length;
                while (l--) {
                  var errorType = errorTypes[l];
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
              return function() {
                var _resolved = promise._resolved;
                var _value = promise._value;
                var p = call0(handler);
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
                var receiver = new Aigle(INTERNAL);
                if (!p || !p.then) {
                  receiver._resolved = _resolved;
                  receiver._value = _value;
                } else if (_resolved === 1) {
                  p.then(
                    function() {
                      return receiver._resolve(_value);
                    },
                    function(reason) {
                      return receiver._reject(reason);
                    }
                  );
                } else {
                  p.then(
                    function() {
                      return receiver._reject(_value);
                    },
                    function(reason) {
                      return receiver._reject(reason);
                    }
                  );
                }
                return receiver;
              };
            }

            function addAigle(promise, receiver, onFulfilled, onRejected) {
              stackTraces && resolveStack(receiver, promise);
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
                promise._receivers.push({ receiver: receiver, onFulfilled: onFulfilled, onRejected: onRejected });
              }
              return receiver;
            }

            function addReceiver(promise, receiver) {
              stackTraces && resolveStack(receiver, promise);
              promise._resolved !== 0 && invokeAsync(promise);
              promise._receiver = receiver;
              return receiver._promise;
            }

            function addProxy(promise, Proxy, arg1, arg2, arg3) {
              if (stackTraces) {
                stackTraces = false;
                var receiver$1 = addProxy(promise, Proxy, arg1, arg2, arg3);
                stackTraces = true;
                resolveStack(receiver$1, promise);
                return receiver$1;
              }
              switch (promise._resolved) {
                case 0:
                  var receiver = new Proxy(PENDING, arg1, arg2, arg3);
                  if (promise._receiver === undefined) {
                    promise._receiver = receiver;
                  } else {
                    if (!promise._receivers) {
                      promise._receivers = new Queue();
                    }
                    promise._receivers.push({ receiver: receiver });
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
            function mixin(sources, opts) {
              if (opts === void 0) opts = {};

              var override = opts.override;
              var promisify = opts.promisify;
              if (promisify === void 0) promisify = true;
              Object.getOwnPropertyNames(sources).forEach(function(key) {
                var func = sources[key];
                if (typeof func !== 'function' || (Aigle[key] && !override)) {
                  return;
                }
                // check lodash chain
                if (key === 'chain') {
                  var obj = func();
                  if (obj && obj.__chain__) {
                    Aigle.chain = _resolve;
                    Aigle.prototype.value = function() {
                      return this;
                    };
                    return;
                  }
                }
                var Proxy = createProxy(func, promisify);
                Aigle[key] = function(value, arg1, arg2, arg3) {
                  return new Proxy(value, arg1, arg2, arg3)._execute();
                };
                Aigle.prototype[key] = function(arg1, arg2, arg3) {
                  return addProxy(this, Proxy, arg1, arg2, arg3);
                };
              });
              return Aigle;
            }
          }.call(this, require('_process')));
        },
        {
          './all': 3,
          './attempt': 4,
          './concat': 5,
          './concatLimit': 6,
          './concatSeries': 7,
          './debug': 8,
          './delay': 9,
          './doUntil': 10,
          './doWhilst': 11,
          './each': 12,
          './eachLimit': 13,
          './eachSeries': 14,
          './error': 15,
          './every': 16,
          './everyLimit': 17,
          './everySeries': 18,
          './filter': 19,
          './filterLimit': 20,
          './filterSeries': 21,
          './find': 22,
          './findIndex': 23,
          './findIndexLimit': 24,
          './findIndexSeries': 25,
          './findKey': 26,
          './findKeyLimit': 27,
          './findKeySeries': 28,
          './findLimit': 29,
          './findSeries': 30,
          './groupBy': 31,
          './groupByLimit': 32,
          './groupBySeries': 33,
          './internal/async': 34,
          './internal/mixin': 36,
          './internal/queue': 37,
          './internal/util': 38,
          './join': 39,
          './map': 40,
          './mapLimit': 41,
          './mapSeries': 42,
          './mapValues': 43,
          './mapValuesLimit': 44,
          './mapValuesSeries': 45,
          './omit': 46,
          './omitBy': 47,
          './omitByLimit': 48,
          './omitBySeries': 49,
          './parallel': 50,
          './pick': 51,
          './pickBy': 52,
          './pickByLimit': 53,
          './pickBySeries': 54,
          './promisify': 55,
          './promisifyAll': 56,
          './props': 57,
          './race': 58,
          './reduce': 59,
          './reject': 60,
          './rejectLimit': 61,
          './rejectSeries': 62,
          './retry': 63,
          './some': 64,
          './someLimit': 65,
          './someSeries': 66,
          './sortBy': 67,
          './sortByLimit': 68,
          './sortBySeries': 69,
          './tap': 70,
          './thru': 71,
          './timeout': 72,
          './times': 73,
          './timesLimit': 74,
          './timesSeries': 75,
          './transform': 76,
          './transformLimit': 77,
          './transformSeries': 78,
          './until': 79,
          './using': 80,
          './whilst': 81,
          _process: 83,
          'aigle-core': 82
        }
      ],
      3: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var promiseArrayEach = ref$1.promiseArrayEach;
          var promiseSetEach = ref$1.promiseSetEach;
          var ref$2 = require('./props');
          var callResolve = ref$2.callResolve;

          var All = (function(AigleProxy) {
            function All(array) {
              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._rest = undefined;
              this._coll = undefined;
              this._result = undefined;
              if (array === PENDING) {
                this._callResolve = this._set;
              } else {
                this._callResolve = undefined;
                this._set(array);
              }
            }

            if (AigleProxy) All.__proto__ = AigleProxy;
            All.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            All.prototype.constructor = All;

            All.prototype._set = function _set(array) {
              if (Array.isArray(array)) {
                var size = array.length;
                this._rest = size;
                this._coll = array;
                this._result = Array(size);
                this._callResolve = callResolve;
                promiseArrayEach(this);
              } else if (array instanceof Set) {
                var size$1 = array.size;
                this._rest = size$1;
                this._coll = array;
                this._result = Array(size$1);
                this._callResolve = callResolve;
                promiseSetEach(this);
              } else {
                this._rest = 0;
                this._result = [];
              }
              if (this._rest === 0) {
                this._promise._resolve(this._result);
              }
              return this;
            };

            All.prototype._execute = function _execute() {
              return this._promise;
            };

            All.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return All;
          })(AigleProxy);

          module.exports = { all: all, All: All };

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
        },
        { './aigle': 2, './internal/util': 38, './props': 57, 'aigle-core': 82 }
      ],
      4: [
        function(require, module, exports) {
          'use strict';

          var Aigle = require('./aigle');
          var ref = require('./internal/util');
          var INTERNAL = ref.INTERNAL;
          var callResolve = ref.callResolve;

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
            var receiver = new Aigle(INTERNAL);
            callResolve(receiver, handler);
            return receiver;
          }
        },
        { './aigle': 2, './internal/util': 38 }
      ],
      5: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/util');
          var concatArray = ref$1.concatArray;
          var ref$2 = require('./internal/collection');
          var setParallel = ref$2.setParallel;

          var Concat = (function(Each) {
            function Concat(collection, iterator) {
              Each.call(this, collection, iterator, set);
            }

            if (Each) Concat.__proto__ = Each;
            Concat.prototype = Object.create(Each && Each.prototype);
            Concat.prototype.constructor = Concat;

            Concat.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(concatArray(this._result));
              }
            };

            return Concat;
          })(Each);

          module.exports = { concat: concat, Concat: Concat };

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
        },
        { './each': 12, './internal/collection': 35, './internal/util': 38 }
      ],
      6: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/util');
          var concatArray = ref$1.concatArray;
          var ref$2 = require('./internal/collection');
          var setLimit = ref$2.setLimit;

          var ConcatLimit = (function(EachLimit) {
            function ConcatLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) ConcatLimit.__proto__ = EachLimit;
            ConcatLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            ConcatLimit.prototype.constructor = ConcatLimit;

            ConcatLimit.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(concatArray(this._result));
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            return ConcatLimit;
          })(EachLimit);

          module.exports = { concatLimit: concatLimit, ConcatLimit: ConcatLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35, './internal/util': 38 }
      ],
      7: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;

          var ConcatSeries = (function(EachSeries) {
            function ConcatSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator);
              this._result = [];
            }

            if (EachSeries) ConcatSeries.__proto__ = EachSeries;
            ConcatSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            ConcatSeries.prototype.constructor = ConcatSeries;

            ConcatSeries.prototype._callResolve = function _callResolve(value) {
              var ref;

              if (Array.isArray(value)) {
                (ref = this._result).push.apply(ref, value);
              } else if (value !== undefined) {
                this._result.push(value);
              }
              if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                this._iterate();
              }
            };

            return ConcatSeries;
          })(EachSeries);

          module.exports = { concatSeries: concatSeries, ConcatSeries: ConcatSeries };

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
        },
        { './eachSeries': 14 }
      ],
      8: [
        function(require, module, exports) {
          'use strict';

          module.exports = {
            resolveStack: resolveStack,
            reconstructStack: reconstructStack
          };

          function resolveStack(promise, parent) {
            var ref$1;

            var ref = new Error();
            var stack = ref.stack;
            promise._stacks = promise._stacks || [];
            if (parent && parent._stacks) {
              (ref$1 = promise._stacks).push.apply(ref$1, parent._stacks);
            }
            var stacks = stack.split('\n').slice(4);
            promise._stacks.push(stacks.join('\n'));
          }

          function reconstructStack(promise) {
            var _value = promise._value;
            var _stacks = promise._stacks;
            if (_value instanceof Error === false || !_stacks || _value._reconstructed) {
              return;
            }
            var stacks = _value.stack.split('\n');
            var l = _stacks.length;
            while (l--) {
              stacks.push('From previous event:');
              stacks.push(_stacks[l]);
            }
            _value.stack = stacks.join('\n');
            _value._reconstructed = true;
          }
        },
        {}
      ],
      9: [
        function(require, module, exports) {
          'use strict';

          var Aigle = require('./aigle');
          var ref = require('./internal/util');
          var INTERNAL = ref.INTERNAL;

          var Delay = (function(Aigle) {
            function Delay(ms) {
              Aigle.call(this, INTERNAL);
              this._ms = ms;
              this._timer = undefined;
            }

            if (Aigle) Delay.__proto__ = Aigle;
            Delay.prototype = Object.create(Aigle && Aigle.prototype);
            Delay.prototype.constructor = Delay;

            Delay.prototype._resolve = function _resolve(value) {
              var this$1 = this;

              this._timer = setTimeout(function() {
                return Aigle.prototype._resolve.call(this$1, value);
              }, this._ms);
              return this;
            };

            Delay.prototype._reject = function _reject(reason) {
              clearTimeout(this._timer);
              Aigle.prototype._reject.call(this, reason);
            };

            return Delay;
          })(Aigle);

          module.exports = { delay: delay, Delay: Delay };

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
        },
        { './aigle': 2, './internal/util': 38 }
      ],
      10: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./doWhilst');
          var DoWhilst = ref.DoWhilst;
          var ref$1 = require('./until');
          var UntilTester = ref$1.UntilTester;

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
        },
        { './doWhilst': 11, './until': 79 }
      ],
      11: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./whilst');
          var AigleWhilst = ref.AigleWhilst;
          var WhilstTester = ref.WhilstTester;

          var DoWhilst = (function(AigleWhilst) {
            function DoWhilst(test, iterator) {
              AigleWhilst.call(this, test, iterator);
            }

            if (AigleWhilst) DoWhilst.__proto__ = AigleWhilst;
            DoWhilst.prototype = Object.create(AigleWhilst && AigleWhilst.prototype);
            DoWhilst.prototype.constructor = DoWhilst;

            DoWhilst.prototype._iterate = function _iterate(value) {
              this._next(value);
              return this._promise;
            };

            return DoWhilst;
          })(AigleWhilst);

          module.exports = { doWhilst: doWhilst, DoWhilst: DoWhilst };

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
        },
        { './whilst': 81 }
      ],
      12: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var ref$2 = require('./internal/collection');
          var execute = ref$2.execute;
          var setParallel = ref$2.setParallel;

          var Each = (function(AigleProxy) {
            function Each(collection, iterator, set) {
              if (set === void 0) set = setDefault;

              AigleProxy.call(this);
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

            if (AigleProxy) Each.__proto__ = AigleProxy;
            Each.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Each.prototype.constructor = Each;

            Each.prototype._execute = function _execute() {
              if (this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                this._iterate();
              }
              return this._promise;
            };

            Each.prototype._callResolve = function _callResolve(value) {
              if (--this._rest === 0 || value === false) {
                this._promise._resolve(this._result);
              }
            };

            Each.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Each;
          })(AigleProxy);

          module.exports = { each: each, Each: Each };

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
           * const order = [];
           * const collection = [1, 4, 2];
           * const iterator = (num, index, collection) => {
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
           * const iterator = (num, key, collection) => {
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
           * const iterator = (num, index, collection) => {
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
            return new Each(collection, iterator)._execute();
          }
        },
        { './aigle': 2, './internal/collection': 35, './internal/util': 38, 'aigle-core': 82 }
      ],
      13: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var ref$2 = require('./internal/collection');
          var execute = ref$2.execute;
          var setLimit = ref$2.setLimit;

          var EachLimit = (function(AigleProxy) {
            function EachLimit(collection, limit, iterator, set) {
              if (set === void 0) set = setDefault;

              AigleProxy.call(this);
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

            if (AigleProxy) EachLimit.__proto__ = AigleProxy;
            EachLimit.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            EachLimit.prototype.constructor = EachLimit;

            EachLimit.prototype._execute = function _execute() {
              var this$1 = this;

              if (this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                while (this._limit--) {
                  this$1._iterate();
                }
              }
              return this._promise;
            };

            EachLimit.prototype._callResolve = function _callResolve(value) {
              if (value === false) {
                this._callRest = 0;
                this._promise._resolve(this._result);
              } else if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            EachLimit.prototype._callReject = function _callReject(reason) {
              this._callRest = 0;
              this._promise._reject(reason);
            };

            return EachLimit;
          })(AigleProxy);

          module.exports = { eachLimit: eachLimit, EachLimit: EachLimit };

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
        },
        { './aigle': 2, './internal/collection': 35, './internal/util': 38, 'aigle-core': 82 }
      ],
      14: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var ref$2 = require('./internal/collection');
          var execute = ref$2.execute;
          var setSeries = ref$2.setSeries;

          var EachSeries = (function(AigleProxy) {
            function EachSeries(collection, iterator, set) {
              if (set === void 0) set = setDefault;

              AigleProxy.call(this);
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

            if (AigleProxy) EachSeries.__proto__ = AigleProxy;
            EachSeries.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            EachSeries.prototype.constructor = EachSeries;

            EachSeries.prototype._execute = function _execute() {
              if (this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                this._iterate();
              }
              return this._promise;
            };

            EachSeries.prototype._callResolve = function _callResolve(value) {
              if (--this._rest === 0 || value === false) {
                this._promise._resolve(this._result);
              } else {
                this._iterate();
              }
            };

            EachSeries.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return EachSeries;
          })(AigleProxy);

          module.exports = { eachSeries: eachSeries, EachSeries: EachSeries };

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
        },
        { './aigle': 2, './internal/collection': 35, './internal/util': 38, 'aigle-core': 82 }
      ],
      15: [
        function(require, module, exports) {
          'use strict';

          var types = ['CancellationError', 'TimeoutError'];
          var l = types.length;
          while (l--) {
            exports[types[l]] = (function(Error) {
              function anonymous() {
                Error.apply(this, arguments);
              }
              if (Error) anonymous.__proto__ = Error;
              anonymous.prototype = Object.create(Error && Error.prototype);
              anonymous.prototype.constructor = anonymous;

              return anonymous;
            })(Error);
          }
        },
        {}
      ],
      16: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/util');
          var PENDING = ref$1.PENDING;
          var ref$2 = require('./internal/collection');
          var setShorthand = ref$2.setShorthand;

          var Every = (function(Each) {
            function Every(collection, iterator) {
              Each.call(this, collection, iterator);
              this._result = true;
              if (collection === PENDING) {
                this._set = setShorthand;
              } else {
                setShorthand.call(this, collection);
              }
            }

            if (Each) Every.__proto__ = Each;
            Every.prototype = Object.create(Each && Each.prototype);
            Every.prototype.constructor = Every;

            Every.prototype._callResolve = function _callResolve(value) {
              if (!value) {
                this._promise._resolve(false);
              } else if (--this._rest === 0) {
                this._promise._resolve(true);
              }
            };

            return Every;
          })(Each);

          module.exports = { every: every, Every: Every };

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
        },
        { './each': 12, './internal/collection': 35, './internal/util': 38 }
      ],
      17: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;

          var EveryLimit = (function(EachLimit) {
            function EveryLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator);
              this._result = true;
            }

            if (EachLimit) EveryLimit.__proto__ = EachLimit;
            EveryLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            EveryLimit.prototype.constructor = EveryLimit;

            EveryLimit.prototype._callResolve = function _callResolve(value) {
              if (!value) {
                this._promise._resolve(false);
              } else if (--this._rest === 0) {
                this._promise._resolve(true);
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            return EveryLimit;
          })(EachLimit);

          module.exports = { everyLimit: everyLimit, EveryLimit: EveryLimit };

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
        },
        { './eachLimit': 13 }
      ],
      18: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries.js');
          var EachSeries = ref.EachSeries;

          var EverySeries = (function(EachSeries) {
            function EverySeries(collection, iterator) {
              EachSeries.call(this, collection, iterator);
              this._result = true;
            }

            if (EachSeries) EverySeries.__proto__ = EachSeries;
            EverySeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            EverySeries.prototype.constructor = EverySeries;

            EverySeries.prototype._callResolve = function _callResolve(value) {
              if (!value) {
                this._promise._resolve(false);
              } else if (--this._rest === 0) {
                this._promise._resolve(true);
              } else {
                this._iterate();
              }
            };

            return EverySeries;
          })(EachSeries);

          module.exports = { everySeries: everySeries, EverySeries: EverySeries };

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
        },
        { './eachSeries.js': 14 }
      ],
      19: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var compactArray = ref$2.compactArray;

          var Filter = (function(Each) {
            function Filter(collection, iterator) {
              Each.call(this, collection, iterator, set);
            }

            if (Each) Filter.__proto__ = Each;
            Filter.prototype = Object.create(Each && Each.prototype);
            Filter.prototype.constructor = Filter;

            return Filter;
          })(Each);

          Filter.prototype._set = set;

          module.exports = { filter: filter, Filter: Filter };

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
        },
        { './each': 12, './internal/collection': 35, './internal/util': 38 }
      ],
      20: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var compactArray = ref$2.compactArray;

          var FilterLimit = (function(EachLimit) {
            function FilterLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) FilterLimit.__proto__ = EachLimit;
            FilterLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            FilterLimit.prototype.constructor = FilterLimit;

            return FilterLimit;
          })(EachLimit);

          module.exports = { filterLimit: filterLimit, FilterLimit: FilterLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35, './internal/util': 38 }
      ],
      21: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var compactArray = ref$2.compactArray;

          var FilterSeries = (function(EachSeries) {
            function FilterSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
            }

            if (EachSeries) FilterSeries.__proto__ = EachSeries;
            FilterSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            FilterSeries.prototype.constructor = FilterSeries;

            return FilterSeries;
          })(EachSeries);

          module.exports = { filterSeries: filterSeries, FilterSeries: FilterSeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35, './internal/util': 38 }
      ],
      22: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var Find = (function(Each) {
            function Find(collection, iterator) {
              Each.call(this, collection, iterator, set);
            }

            if (Each) Find.__proto__ = Each;
            Find.prototype = Object.create(Each && Each.prototype);
            Find.prototype.constructor = Find;

            return Find;
          })(Each);

          module.exports = { find: find, Find: Find };

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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      23: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var FindIndex = (function(Each) {
            function FindIndex(collection, iterator) {
              Each.call(this, collection, iterator, set);
              this._result = -1;
            }

            if (Each) FindIndex.__proto__ = Each;
            FindIndex.prototype = Object.create(Each && Each.prototype);
            FindIndex.prototype.constructor = FindIndex;

            FindIndex.prototype._callResolve = function _callResolve(value, index) {
              if (value) {
                this._size = 0;
                this._promise._resolve(index);
              } else if (--this._rest === 0) {
                this._promise._resolve(-1);
              }
            };

            return FindIndex;
          })(Each);

          module.exports = { findIndex: findIndex, FindIndex: FindIndex };

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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      24: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;

          var FindIndexLimit = (function(EachLimit) {
            function FindIndexLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
              this._result = -1;
            }

            if (EachLimit) FindIndexLimit.__proto__ = EachLimit;
            FindIndexLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            FindIndexLimit.prototype.constructor = FindIndexLimit;

            FindIndexLimit.prototype._callResolve = function _callResolve(value, index) {
              if (value) {
                this._callRest = 0;
                this._promise._resolve(index);
              } else if (--this._rest === 0) {
                this._promise._resolve(-1);
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            return FindIndexLimit;
          })(EachLimit);

          module.exports = { findIndexLimit: findIndexLimit, FindIndexLimit: FindIndexLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35 }
      ],
      25: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;

          var FindIndexSeries = (function(EachSeries) {
            function FindIndexSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
              this._result = -1;
            }

            if (EachSeries) FindIndexSeries.__proto__ = EachSeries;
            FindIndexSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            FindIndexSeries.prototype.constructor = FindIndexSeries;
            FindIndexSeries.prototype._callResolve = function _callResolve(value, index) {
              if (value) {
                this._promise._resolve(index);
              } else if (--this._rest === 0) {
                this._promise._resolve(-1);
              } else {
                this._iterate();
              }
            };

            return FindIndexSeries;
          })(EachSeries);

          module.exports = { findIndexSeries: findIndexSeries, FindIndexSeries: FindIndexSeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35 }
      ],
      26: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var FindKey = (function(Each) {
            function FindKey(collection, iterator) {
              Each.call(this, collection, iterator, set);
            }

            if (Each) FindKey.__proto__ = Each;
            FindKey.prototype = Object.create(Each && Each.prototype);
            FindKey.prototype.constructor = FindKey;

            return FindKey;
          })(Each);

          module.exports = { findKey: findKey, FindKey: FindKey };

          function set(collection) {
            setShorthand.call(this, collection);
            this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
            return this;
          }

          function callResolveArray(value, index) {
            if (value) {
              this._size = 0;
              this._promise._resolve('' + index);
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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      27: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;

          var FindKeyLimit = (function(EachLimit) {
            function FindKeyLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) FindKeyLimit.__proto__ = EachLimit;
            FindKeyLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            FindKeyLimit.prototype.constructor = FindKeyLimit;

            return FindKeyLimit;
          })(EachLimit);

          module.exports = { findKeyLimit: findKeyLimit, FindKeyLimit: FindKeyLimit };

          function set(collection) {
            setLimit.call(this, collection);
            this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
            return this;
          }

          function callResolveArray(value, index) {
            if (value) {
              this._callRest = 0;
              this._promise._resolve('' + index);
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
        },
        { './eachLimit': 13, './internal/collection': 35 }
      ],
      28: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;

          var FindKeySeries = (function(EachSeries) {
            function FindKeySeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
            }

            if (EachSeries) FindKeySeries.__proto__ = EachSeries;
            FindKeySeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            FindKeySeries.prototype.constructor = FindKeySeries;

            return FindKeySeries;
          })(EachSeries);

          module.exports = { findKeySeries: findKeySeries, FindKeySeries: FindKeySeries };

          function set(collection) {
            setSeries.call(this, collection);
            this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
            return this;
          }

          function callResolveArray(value, index) {
            if (value) {
              this._promise._resolve('' + index);
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
        },
        { './eachSeries': 14, './internal/collection': 35 }
      ],
      29: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;

          var FindLimit = (function(EachLimit) {
            function FindLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) FindLimit.__proto__ = EachLimit;
            FindLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            FindLimit.prototype.constructor = FindLimit;

            return FindLimit;
          })(EachLimit);

          module.exports = { findLimit: findLimit, FindLimit: FindLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35 }
      ],
      30: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;

          var FindSeries = (function(EachSeries) {
            function FindSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
            }

            if (EachSeries) FindSeries.__proto__ = EachSeries;
            FindSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            FindSeries.prototype.constructor = FindSeries;

            return FindSeries;
          })(EachSeries);

          module.exports = { findSeries: findSeries, FindSeries: FindSeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35 }
      ],
      31: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var GroupBy = (function(Each) {
            function GroupBy(collection, iterator) {
              Each.call(this, collection, iterator, set);
              this._result = {};
            }

            if (Each) GroupBy.__proto__ = Each;
            GroupBy.prototype = Object.create(Each && Each.prototype);
            GroupBy.prototype.constructor = GroupBy;

            return GroupBy;
          })(Each);

          module.exports = { groupBy: groupBy, GroupBy: GroupBy };

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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      32: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;

          var GroupByLimit = (function(EachLimit) {
            function GroupByLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
              this._result = {};
            }

            if (EachLimit) GroupByLimit.__proto__ = EachLimit;
            GroupByLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            GroupByLimit.prototype.constructor = GroupByLimit;

            return GroupByLimit;
          })(EachLimit);

          module.exports = { groupByLimit: groupByLimit, GroupByLimit: GroupByLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35 }
      ],
      33: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;

          var GroupBySeries = (function(EachSeries) {
            function GroupBySeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
              this._result = {};
            }

            if (EachSeries) GroupBySeries.__proto__ = EachSeries;
            GroupBySeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            GroupBySeries.prototype.constructor = GroupBySeries;

            return GroupBySeries;
          })(EachSeries);

          module.exports = { groupBySeries: groupBySeries, GroupBySeries: GroupBySeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35 }
      ],
      34: [
        function(require, module, exports) {
          'use strict';

          var queue = Array(8);
          var len = 0;
          var ticked = false;

          function tick() {
            var i = -1;
            while (++i < len) {
              var promise = queue[i];
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
        },
        {}
      ],
      35: [
        function(require, module, exports) {
          'use strict';

          // TODO: refactor

          var ref = require('./util');
          var call3 = ref.call3;
          var callProxyReciever = ref.callProxyReciever;

          var ref$1 = [
            [iterateArrayParallel, iterateObjectParallel],
            [iterateArrayParallel, iterateObjectParallelWithOrder],
            [iterateArraySeries, iterateObjectSeries]
          ].map(createSet);
          var setParallel = ref$1[0];
          var setParallelWithOrder = ref$1[1];
          var setSeries = ref$1[2];

          var iteratorMap = {
            iterateArrayParallel: iterateArrayParallel,
            iterateArrayWithString: iterateArrayWithString,
            iterateArrayWithArray: iterateArrayWithArray,
            iterateArrayWithObject: iterateArrayWithObject,
            iterateObjectParallel: iterateObjectParallel,
            iterateObjectWithString: iterateObjectWithString,
            iterateObjectWithArray: iterateObjectWithArray,
            iterateObjectWithObject: iterateObjectWithObject
          };
          var ref$2 = [
            iteratorMap,
            Object.assign({}, iteratorMap, {
              iterateObjectParallel: iterateObjectParallelWithOrder
            }),
            Object.assign({}, iteratorMap, {
              iterateArrayWithArray: iteratePickWithArray,
              iterateObjectWithArray: iteratePickWithArray
            }),
            Object.assign({}, iteratorMap, {
              iterateArrayWithArray: iterateOmitWithArray,
              iterateObjectWithArray: iterateOmitWithArray
            })
          ].map(createSetShorthand);
          var setShorthand = ref$2[0];
          var setShorthandWithOrder = ref$2[1];
          var setPickShorthand = ref$2[2];
          var setOmitShorthand = ref$2[3];

          module.exports = {
            execute: execute,
            setParallel: setParallel,
            setParallelWithOrder: setParallelWithOrder,
            setShorthand: setShorthand,
            setShorthandWithOrder: setShorthandWithOrder,
            setPickShorthand: setPickShorthand,
            setOmitShorthand: setOmitShorthand,
            setSeries: setSeries,
            setLimit: setLimit
          };

          function execute(collection) {
            this._callResolve = this._iterate;
            this._set(collection);
            this._execute();
          }

          function createSet(ref) {
            var iterateArray = ref[0];
            var iterateObject = ref[1];

            return function set(collection) {
              if (Array.isArray(collection)) {
                this._coll = collection;
                this._size = collection.length;
                this._iterate = iterateArray;
              } else if (collection && typeof collection === 'object') {
                var keys = Object.keys(collection);
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

          function createSetShorthand(ref) {
            var iterateArrayParallel = ref.iterateArrayParallel;
            var iterateArrayWithString = ref.iterateArrayWithString;
            var iterateArrayWithArray = ref.iterateArrayWithArray;
            var iterateArrayWithObject = ref.iterateArrayWithObject;
            var iterateObjectParallel = ref.iterateObjectParallel;
            var iterateObjectWithString = ref.iterateObjectWithString;
            var iterateObjectWithArray = ref.iterateObjectWithArray;
            var iterateObjectWithObject = ref.iterateObjectWithObject;

            return function set(collection) {
              if (Array.isArray(collection)) {
                this._coll = collection;
                this._size = collection.length;
                switch (typeof this._iterator) {
                  case 'function':
                    this._iterate = iterateArrayParallel;
                    break;
                  case 'string':
                    this._iterate = iterateArrayWithString;
                    break;
                  case 'object':
                    this._iterate = Array.isArray(this._iterator) ? iterateArrayWithArray : iterateArrayWithObject;
                    break;
                }
              } else if (collection && typeof collection === 'object') {
                var keys = Object.keys(collection);
                this._coll = collection;
                this._size = keys.length;
                this._keys = keys;
                switch (typeof this._iterator) {
                  case 'function':
                    this._iterate = iterateObjectParallel;
                    break;
                  case 'string':
                    this._iterate = iterateObjectWithString;
                    break;
                  case 'object':
                    this._iterate = Array.isArray(this._iterator) ? iterateObjectWithArray : iterateObjectWithObject;
                    break;
                }
              } else {
                this._size = 0;
              }
              this._rest = this._size;
              return this;
            };
          }

          function setLimit(collection) {
            setSeries.call(this, collection);
            var ref = this;
            var _limit = ref._limit;
            var _size = ref._size;
            this._limit = _limit < _size ? _limit : _size;
            this._callRest = _size - this._limit;
            return this;
          }

          function iterateArrayParallel() {
            var ref = this;
            var _rest = ref._rest;
            var _iterator = ref._iterator;
            var _coll = ref._coll;
            var i = -1;
            while (++i < _rest && callProxyReciever(call3(_iterator, _coll[i], i, _coll), this, i)) {}
          }

          function iterateObjectParallel() {
            var this$1 = this;

            var ref = this;
            var _rest = ref._rest;
            var _iterator = ref._iterator;
            var _coll = ref._coll;
            var _keys = ref._keys;
            var i = -1;
            while (++i < _rest) {
              var key = _keys[i];
              if (callProxyReciever(call3(_iterator, _coll[key], key, _coll), this$1, i) === false) {
                break;
              }
            }
          }
          function iterateObjectParallelWithOrder() {
            var this$1 = this;

            var ref = this;
            var _rest = ref._rest;
            var _iterator = ref._iterator;
            var _coll = ref._coll;
            var _keys = ref._keys;
            var _result = ref._result;
            var i = -1;
            while (++i < _rest) {
              var key = _keys[i];
              _result[key] = undefined;
              if (callProxyReciever(call3(_iterator, _coll[key], key, _coll), this$1, i) === false) {
                break;
              }
            }
          }

          function iterateArraySeries() {
            var ref = this;
            var _coll = ref._coll;
            var i = this._index++;
            callProxyReciever(call3(this._iterator, _coll[i], i, _coll), this, i);
          }

          function iterateObjectSeries() {
            var ref = this;
            var _coll = ref._coll;
            var i = this._index++;
            var key = this._keys[i];
            callProxyReciever(call3(this._iterator, _coll[key], key, _coll), this, i);
          }

          function iterateArrayWithString() {
            var this$1 = this;

            var ref = this;
            var _iterator = ref._iterator;
            var _coll = ref._coll;
            var i = -1;
            while (++i < this._size) {
              var obj = _coll[i];
              if (obj) {
                this$1._callResolve(obj[_iterator], i);
              } else {
                this$1._callResolve(undefined, i);
              }
            }
          }

          function iterateObjectWithString() {
            var this$1 = this;

            var ref = this;
            var _iterator = ref._iterator;
            var _coll = ref._coll;
            var _keys = ref._keys;
            var i = -1;
            while (++i < this._size) {
              var obj = _coll[_keys[i]];
              if (obj) {
                this$1._callResolve(obj[_iterator], i);
              } else {
                this$1._callResolve(undefined, i);
              }
            }
          }

          function iterateArrayWithArray() {
            var this$1 = this;

            var ref = this;
            var _coll = ref._coll;
            var ref$1 = this._iterator;
            var key = ref$1[0];
            var value = ref$1[1];
            var i = -1;
            while (++i < this._size) {
              var obj = _coll[i];
              if (obj) {
                this$1._callResolve(obj[key] === value, i);
              } else {
                this$1._callResolve(undefined, i);
              }
            }
          }

          function iterateObjectWithArray() {
            var this$1 = this;

            var ref = this;
            var _coll = ref._coll;
            var _keys = ref._keys;
            var ref$1 = this._iterator;
            var key = ref$1[0];
            var value = ref$1[1];
            var i = -1;
            while (++i < this._size) {
              var obj = _coll[_keys[i]];
              if (obj) {
                this$1._callResolve(obj[key] === value, i);
              } else {
                this$1._callResolve(undefined, i);
              }
            }
          }

          function iterateArrayWithObject() {
            var this$1 = this;

            var ref = this;
            var object = ref._iterator;
            var _coll = ref._coll;
            var keys = Object.keys(object);
            var i = -1;
            first: while (++i < this._size) {
              var obj = _coll[i];
              if (!obj) {
                this$1._callResolve(undefined, i);
                continue;
              }
              var l = keys.length;
              while (l--) {
                var key = keys[l];
                if (obj[key] !== object[key]) {
                  this$1._callResolve(false, i);
                  continue first;
                }
              }
              this$1._callResolve(true, i);
            }
          }

          function iterateObjectWithObject() {
            var this$1 = this;

            var ref = this;
            var object = ref._iterator;
            var _coll = ref._coll;
            var _keys = ref._keys;
            var keys = Object.keys(object);
            var i = -1;
            first: while (++i < this._size) {
              var obj = _coll[_keys[i]];
              if (!obj) {
                this$1._callResolve(undefined, i);
                continue;
              }
              var l = keys.length;
              while (l--) {
                var key = keys[l];
                if (obj[key] !== object[key]) {
                  this$1._callResolve(false, i);
                  continue first;
                }
              }
              this$1._callResolve(true, i);
            }
          }

          function iteratePickWithArray() {
            var ref = this;
            var _coll = ref._coll;
            var _result = ref._result;
            pick(this._iterator);
            this._promise._resolve(_result);

            function pick(array) {
              var i = -1;
              while (++i < array.length) {
                var key = array[i];
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
            var ref = this;
            var _coll = ref._coll;
            var _result = ref._result;
            var map = {};
            createMap(this._iterator);
            Object.keys(_coll).forEach(function(key) {
              if (map.hasOwnProperty(key) === false) {
                _result[key] = _coll[key];
              }
            });
            this._promise._resolve(_result);

            function createMap(array) {
              var i = -1;
              while (++i < array.length) {
                var key = array[i];
                if (Array.isArray(key)) {
                  createMap(key);
                  continue;
                }
                map[key] = true;
              }
            }
          }
        },
        { './util': 38 }
      ],
      36: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('../aigle');
          var ref$1 = require('../map');
          var map = ref$1.map;
          var ref$2 = require('../mapValues');
          var mapValues = ref$2.mapValues;
          var ref$3 = require('./util');
          var INTERNAL = ref$3.INTERNAL;
          var PENDING = ref$3.PENDING;
          var apply = ref$3.apply;
          var callProxyReciever = ref$3.callProxyReciever;

          module.exports = { createProxy: createProxy };

          var MixinProxy = (function(AigleProxy) {
            function MixinProxy(func, exec, args) {
              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._func = func;
              this._args = args;
              this._execute = exec;
              if (args[0] === PENDING) {
                this._set = this._callResolve;
                this._callResolve = exec;
              }
            }

            if (AigleProxy) MixinProxy.__proto__ = AigleProxy;
            MixinProxy.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            MixinProxy.prototype.constructor = MixinProxy;

            MixinProxy.prototype._callResolve = function _callResolve(value) {
              this._promise._resolve(value);
            };

            MixinProxy.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return MixinProxy;
          })(AigleProxy);

          function execute(value) {
            var ref = this;
            var _args = ref._args;
            if (_args[0] === PENDING) {
              _args[0] = value;
              this._callResolve = this._set;
            }
            callProxyReciever(apply(this._func, _args), this);
            return this._promise;
          }

          function executeWithPromisify(value) {
            var this$1 = this;

            var ref = this;
            var _args = ref._args;
            if (_args[0] === PENDING) {
              _args[0] = value;
              this._callResolve = this._set;
            } else {
              value = _args[0];
            }
            var iterator = _args[1];
            var isFunc = typeof iterator === 'function';
            if (isFunc && Array.isArray(value)) {
              callIterator(this, map, function(array) {
                var index = 0;
                _args[1] = function() {
                  return array[index++];
                };
                callProxyReciever(apply(this$1._func, _args), this$1);
              });
            } else if (isFunc && value && typeof value === 'object') {
              callIterator(this, mapValues, function(object) {
                var index = 0;
                var keys = Object.keys(object);
                _args[1] = function() {
                  return object[keys[index++]];
                };
                callProxyReciever(apply(this$1._func, _args), this$1);
              });
            } else {
              callProxyReciever(apply(this._func, _args), this);
            }
            return this._promise;
          }

          function callIterator(proxy, func, onFulfilled) {
            var ref = proxy._args;
            var collection = ref[0];
            var iterator = ref[1];
            var p = func(collection, function(value, key) {
              return iterator(value, key, collection);
            });
            return p._resolved === 1
              ? onFulfilled(p._value)
              : p.then(onFulfilled, function(error) {
                  return proxy._callReject(error);
                });
          }

          /**
           * @private
           * @param {function} func
           * @param {boolean} promisify
           */
          function createProxy(func, promisify) {
            var exec = promisify ? executeWithPromisify : execute;
            return (function(MixinProxy) {
              function anonymous() {
                var args = [],
                  len = arguments.length;
                while (len--) args[len] = arguments[len];

                MixinProxy.call(this, func, exec, args);
              }

              if (MixinProxy) anonymous.__proto__ = MixinProxy;
              anonymous.prototype = Object.create(MixinProxy && MixinProxy.prototype);
              anonymous.prototype.constructor = anonymous;

              return anonymous;
            })(MixinProxy);
          }
        },
        { '../aigle': 2, '../map': 40, '../mapValues': 43, './util': 38, 'aigle-core': 82 }
      ],
      37: [
        function(require, module, exports) {
          'use strict';

          var Queue = function Queue(size) {
            if (size === void 0) size = 8;

            this.array = Array(size);
            this.length = 0;
          };

          Queue.prototype.push = function push(task) {
            this.array[this.length++] = task;
          };

          module.exports = Queue;
        },
        {}
      ],
      38: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleCore = ref.AigleCore;
          var ref$1 = require('../../package.json');
          var VERSION = ref$1.version;
          var DEFAULT_LIMIT = 8;
          var errorObj = { e: undefined };
          var iteratorSymbol = typeof Symbol === 'function' ? Symbol.iterator : function SYMBOL() {};

          module.exports = {
            VERSION: VERSION,
            DEFAULT_LIMIT: DEFAULT_LIMIT,
            INTERNAL: INTERNAL,
            PENDING: PENDING,
            UNHANDLED: UNHANDLED,
            defaultIterator: defaultIterator,
            errorObj: errorObj,
            iteratorSymbol: iteratorSymbol,
            call0: call0,
            call1: call1,
            call3: call3,
            apply: apply,
            callResolve: callResolve,
            callReject: callReject,
            callReceiver: callReceiver,
            callThen: callThen,
            callProxyReciever: callProxyReciever,
            promiseArrayEach: promiseArrayEach,
            promiseObjectEach: promiseObjectEach,
            promiseMapEach: promiseMapEach,
            promiseSetEach: promiseSetEach,
            compactArray: compactArray,
            concatArray: concatArray,
            clone: clone,
            createEmptyObject: createEmptyObject,
            sortArray: sortArray,
            sortObject: sortObject
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
            if (typeof onFulfilled !== 'function') {
              receiver._resolve(value);
              return;
            }
            var promise = call1(onFulfilled, value);
            if (promise === errorObj) {
              receiver._reject(errorObj.e);
              return;
            }
            callReceiver(receiver, promise);
          }

          function callReject(receiver, onRejected, reason) {
            if (typeof onRejected !== 'function') {
              receiver._reject(reason);
              return;
            }
            var promise = call1(onRejected, reason);
            if (promise === errorObj) {
              receiver._reject(errorObj.e);
              return;
            }
            callReceiver(receiver, promise);
          }

          function callReceiver(receiver, promise) {
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
              receiver._callReject(reason);
            }
          }

          function callProxyReciever(promise, receiver, index) {
            if (promise instanceof AigleCore) {
              switch (promise._resolved) {
                case 0:
                  promise._addReceiver(receiver, index);
                  return true;
                case 1:
                  receiver._callResolve(promise._value, index);
                  return true;
                case 2:
                  promise.suppressUnhandledRejections();
                  receiver._callReject(promise._value);
                  return false;
              }
            }
            if (promise === errorObj) {
              receiver._callReject(errorObj.e);
              return false;
            }
            if (promise && promise.then) {
              callProxyThen(promise, receiver, index);
            } else {
              receiver._callResolve(promise, index);
            }
            return true;
          }

          function promiseArrayEach(receiver) {
            var _rest = receiver._rest;
            var _coll = receiver._coll;
            var i = -1;
            while (++i < _rest) {
              var promise = _coll[i];
              if (promise instanceof AigleCore) {
                switch (promise._resolved) {
                  case 0:
                    promise._addReceiver(receiver, i);
                    continue;
                  case 1:
                    receiver._callResolve(promise._value, i);
                    continue;
                  case 2:
                    promise.suppressUnhandledRejections();
                    receiver._callReject(promise._value);
                    return;
                }
              }
              if (promise && promise.then) {
                callProxyThen(promise, receiver, i);
              } else {
                receiver._callResolve(promise, i);
              }
            }
          }

          function promiseObjectEach(receiver) {
            var _rest = receiver._rest;
            var _keys = receiver._keys;
            var _coll = receiver._coll;
            var _result = receiver._result;
            var i = -1;
            while (++i < _rest) {
              var key = _keys[i];
              var promise = _coll[key];
              _result[key] = undefined;
              if (promise instanceof AigleCore) {
                switch (promise._resolved) {
                  case 0:
                    promise._addReceiver(receiver, key);
                    continue;
                  case 1:
                    receiver._callResolve(promise._value, key);
                    continue;
                  case 2:
                    promise.suppressUnhandledRejections();
                    receiver._callReject(promise._value);
                    return;
                }
              }
              if (promise && promise.then) {
                callProxyThen(promise, receiver, key);
              } else {
                receiver._callResolve(promise, key);
              }
            }
          }

          function promiseSetEach(receiver) {
            var iter = receiver._coll[iteratorSymbol]();
            var i = -1;
            var item;
            while ((item = iter.next()).done === false) {
              var promise = item.value;
              if (promise instanceof AigleCore) {
                switch (promise._resolved) {
                  case 0:
                    promise._addReceiver(receiver, ++i);
                    continue;
                  case 1:
                    receiver._callResolve(promise._value, ++i);
                    continue;
                  case 2:
                    promise.suppressUnhandledRejections();
                    receiver._callReject(promise._value);
                    return;
                }
              }
              if (promise && promise.then) {
                callProxyThen(promise, receiver, ++i);
              } else {
                receiver._callResolve(promise, ++i);
              }
            }
          }

          function promiseMapEach(receiver) {
            var _result = receiver._result;
            var iter = receiver._coll[iteratorSymbol]();
            var item;
            while ((item = iter.next()).done === false) {
              var ref = item.value;
              var key = ref[0];
              var promise = ref[1];
              _result.set(key, promise);
              if (promise instanceof AigleCore) {
                switch (promise._resolved) {
                  case 0:
                    promise._addReceiver(receiver, key);
                    continue;
                  case 1:
                    receiver._callResolve(promise._value, key);
                    continue;
                  case 2:
                    promise.suppressUnhandledRejections();
                    receiver._callReject(promise._value);
                    return;
                }
              }
              if (promise && promise.then) {
                callProxyThen(promise, receiver, key);
              } else {
                receiver._callResolve(promise, key);
              }
            }
          }

          function compactArray(array) {
            var i = -1;
            var l = array.length;
            var result = [];
            while (++i < l) {
              var value = array[i];
              if (value !== INTERNAL) {
                result.push(value);
              }
            }
            return result;
          }

          function concatArray(array) {
            var i = -1;
            var l = array.length;
            var result = [];
            while (++i < l) {
              var value = array[i];
              if (Array.isArray(value)) {
                result.push.apply(result, value);
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
            var l = array.length;
            var result = Array(l);
            while (l--) {
              result[l] = array[l];
            }
            return result;
          }

          function cloneObject(object) {
            var keys = Object.keys(object);
            var l = keys.length;
            var result = {};
            while (l--) {
              var key = keys[l];
              result[key] = object[key];
            }
            return result;
          }

          function createEmptyObject(object, keys) {
            var i = -1;
            var l = keys.length;
            var result = {};
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
            var l = array.length;
            var indices = Array(l);
            for (var i = 0; i < l; i++) {
              indices[i] = i;
            }
            quickSort(criteria, 0, l - 1, indices);
            var result = Array(l);
            for (var n = 0; n < l; n++) {
              var i$1 = indices[n];
              result[n] = i$1 === undefined ? array[n] : array[i$1];
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
            var l = keys.length;
            var indices = Array(l);
            for (var i = 0; i < l; i++) {
              indices[i] = i;
            }
            quickSort(criteria, 0, l - 1, indices);
            var result = Array(l);
            for (var n = 0; n < l; n++) {
              var i$1 = indices[n];
              result[n] = object[keys[i$1 === undefined ? n : i$1]];
            }
            return result;
          }

          function partition(array, i, j, mid, indices) {
            var l = i;
            var r = j;
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
            var n = array[l];
            array[l] = array[r];
            array[r] = n;
            var i = indices[l];
            indices[l] = indices[r];
            indices[r] = i;
          }

          function quickSort(array, i, j, indices) {
            if (i === j) {
              return;
            }
            var k = i;
            while (++k <= j && array[i] === array[k]) {
              var l = k - 1;
              if (indices[l] > indices[k]) {
                var i$1 = indices[l];
                indices[l] = indices[k];
                indices[k] = i$1;
              }
            }
            if (k > j) {
              return;
            }
            var p = array[i] > array[k] ? i : k;
            k = partition(array, i, j, array[p], indices);
            quickSort(array, i, k - 1, indices);
            quickSort(array, k, j, indices);
          }
        },
        { '../../package.json': 88, 'aigle-core': 82 }
      ],
      39: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var call1 = ref$1.call1;
          var apply = ref$1.apply;
          var callProxyReciever = ref$1.callProxyReciever;

          var Join = (function(AigleProxy) {
            function Join(handler, size) {
              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._rest = size;
              this._result = Array(size);
              this._handler = handler;
            }

            if (AigleProxy) Join.__proto__ = AigleProxy;
            Join.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Join.prototype.constructor = Join;

            Join.prototype._callResolve = function _callResolve(value, index) {
              if (index === INTERNAL) {
                return this._promise._resolve(value);
              }
              this._result[index] = value;
              if (--this._rest !== 0) {
                return;
              }
              var ref = this;
              var _handler = ref._handler;
              var _result = ref._result;
              if (_handler === undefined) {
                this._promise._resolve(_result);
              } else {
                callProxyReciever(apply(_handler, _result), this, INTERNAL);
              }
            };

            Join.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Join;
          })(AigleProxy);

          var Spread = (function(AigleProxy) {
            function Spread(handler) {
              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._handler = handler;
            }

            if (AigleProxy) Spread.__proto__ = AigleProxy;
            Spread.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Spread.prototype.constructor = Spread;

            Spread.prototype._callResolve = function _callResolve(value, index) {
              if (index === INTERNAL) {
                return this._promise._resolve(value);
              }
              spread(this, value);
            };

            Spread.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Spread;
          })(AigleProxy);

          module.exports = { join: join, Spread: Spread };

          /**
           * @example
           * const p1 = Aigle.delay(20).then(() => 1);
           * const p2 = Aigle.delay(10).then(() => 2);
           * Aigle.join(p1, p2, (v1, v2) => {
           *   console.log(v1, v2); // 1 2
           * });
           */
          function join() {
            var arguments$1 = arguments;

            var l = arguments.length;
            var handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
            var receiver = new Join(handler, l);
            while (l--) {
              callProxyReciever(arguments$1[l], receiver, l);
            }
            return receiver._promise;
          }

          /**
           * @private
           * @param {AigleProxy} proxy
           * @param {string|Array|Object} array
           */
          function spread(proxy, array) {
            var _handler = proxy._handler;
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
                  var keys = Object.keys(array);
                  var l = keys.length;
                  var arr = Array(l);
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
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      40: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var Map = (function(Each) {
            function Map(collection, iterator) {
              Each.call(this, collection, iterator, set);
            }

            if (Each) Map.__proto__ = Each;
            Map.prototype = Object.create(Each && Each.prototype);
            Map.prototype.constructor = Map;

            Map.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(this._result);
              }
            };

            return Map;
          })(Each);

          module.exports = { map: map, Map: Map };

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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      41: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;

          var MapLimit = (function(EachLimit) {
            function MapLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) MapLimit.__proto__ = EachLimit;
            MapLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            MapLimit.prototype.constructor = MapLimit;

            MapLimit.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            return MapLimit;
          })(EachLimit);

          module.exports = { mapLimit: mapLimit, MapLimit: MapLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35 }
      ],
      42: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;

          var MapSeries = (function(EachSeries) {
            function MapSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
            }

            if (EachSeries) MapSeries.__proto__ = EachSeries;
            MapSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            MapSeries.prototype.constructor = MapSeries;

            MapSeries.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                this._iterate();
              }
            };

            return MapSeries;
          })(EachSeries);

          module.exports = { mapSeries: mapSeries, MapSeries: MapSeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35 }
      ],
      43: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthandWithOrder = ref$1.setShorthandWithOrder;

          var MapValues = (function(Each) {
            function MapValues(collection, iterator) {
              Each.call(this, collection, iterator, set);
              this._result = {};
            }

            if (Each) MapValues.__proto__ = Each;
            MapValues.prototype = Object.create(Each && Each.prototype);
            MapValues.prototype.constructor = MapValues;

            return MapValues;
          })(Each);

          module.exports = { mapValues: mapValues, MapValues: MapValues };

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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      44: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;
          var ref$2 = require('./internal/util');
          var createEmptyObject = ref$2.createEmptyObject;

          var MapValuesLimit = (function(EachLimit) {
            function MapValuesLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) MapValuesLimit.__proto__ = EachLimit;
            MapValuesLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            MapValuesLimit.prototype.constructor = MapValuesLimit;

            return MapValuesLimit;
          })(EachLimit);

          module.exports = { mapValuesLimit: mapValuesLimit, MapValuesLimit: MapValuesLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35, './internal/util': 38 }
      ],
      45: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;

          var MapValuesSeries = (function(EachSeries) {
            function MapValuesSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
              this._result = {};
            }

            if (EachSeries) MapValuesSeries.__proto__ = EachSeries;
            MapValuesSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            MapValuesSeries.prototype.constructor = MapValuesSeries;

            return MapValuesSeries;
          })(EachSeries);

          module.exports = { mapValuesSeries: mapValuesSeries, MapValuesSeries: MapValuesSeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35 }
      ],
      46: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setOmitShorthand = ref$1.setOmitShorthand;

          var Omit = (function(Each) {
            function Omit(collection, iterator, args) {
              if (typeof iterator !== 'function') {
                iterator = [iterator].concat(args);
              }
              Each.call(this, collection, iterator, set);
              this._result = {};
            }

            if (Each) Omit.__proto__ = Each;
            Omit.prototype = Object.create(Each && Each.prototype);
            Omit.prototype.constructor = Omit;

            return Omit;
          })(Each);

          module.exports = { omit: omit, Omit: Omit };

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
              var key = this._keys[index];
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
          function omit(collection, iterator) {
            var args = [],
              len = arguments.length - 2;
            while (len-- > 0) args[len] = arguments[len + 2];

            return new Omit(collection, iterator, args)._execute();
          }
        },
        { './each': 12, './internal/collection': 35 }
      ],
      47: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var OmitBy = (function(Each) {
            function OmitBy(collection, iterator) {
              Each.call(this, collection, iterator, set);
              this._result = {};
            }

            if (Each) OmitBy.__proto__ = Each;
            OmitBy.prototype = Object.create(Each && Each.prototype);
            OmitBy.prototype.constructor = OmitBy;

            return OmitBy;
          })(Each);

          module.exports = { omitBy: omitBy, OmitBy: OmitBy };

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
              var key = this._keys[index];
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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      48: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;

          var OmitByLimit = (function(EachLimit) {
            function OmitByLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
              this._result = {};
            }

            if (EachLimit) OmitByLimit.__proto__ = EachLimit;
            OmitByLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            OmitByLimit.prototype.constructor = OmitByLimit;

            return OmitByLimit;
          })(EachLimit);

          module.exports = { omitByLimit: omitByLimit, OmitByLimit: OmitByLimit };

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
              var key = this._keys[index];
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
        },
        { './eachLimit': 13, './internal/collection': 35 }
      ],
      49: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/util');
          var PENDING = ref$1.PENDING;
          var ref$2 = require('./internal/collection');
          var setSeries = ref$2.setSeries;

          var OmitBySeries = (function(EachSeries) {
            function OmitBySeries(collection, iterator) {
              EachSeries.call(this, collection, iterator);
              this._result = {};
              if (collection === PENDING) {
                this._set = set;
              } else {
                this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
              }
            }

            if (EachSeries) OmitBySeries.__proto__ = EachSeries;
            OmitBySeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            OmitBySeries.prototype.constructor = OmitBySeries;

            return OmitBySeries;
          })(EachSeries);

          module.exports = { omitBySeries: omitBySeries, OmitBySeries: OmitBySeries };

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
              var key = this._keys[index];
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
        },
        { './eachSeries': 14, './internal/collection': 35, './internal/util': 38 }
      ],
      50: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var promiseArrayEach = ref$1.promiseArrayEach;
          var promiseObjectEach = ref$1.promiseObjectEach;
          var promiseMapEach = ref$1.promiseMapEach;
          var promiseSetEach = ref$1.promiseSetEach;
          var iteratorSymbol = ref$1.iteratorSymbol;
          var ref$2 = require('./props');
          var callResolve = ref$2.callResolve;
          var callResolveMap = ref$2.callResolveMap;

          var Parallel = (function(AigleProxy) {
            function Parallel(collection) {
              AigleProxy.call(this);
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

            if (AigleProxy) Parallel.__proto__ = AigleProxy;
            Parallel.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Parallel.prototype.constructor = Parallel;

            Parallel.prototype._set = function _set(collection) {
              this._coll = collection;
              if (Array.isArray(collection)) {
                var size = collection.length;
                this._rest = size;
                this._result = Array(size);
                this._callResolve = callResolve;
                promiseArrayEach(this);
              } else if (!collection || typeof collection !== 'object') {
                this._rest = 0;
                this._result = {};
              } else if (collection[iteratorSymbol]) {
                this._rest = collection.size;
                if (collection instanceof Map) {
                  this._result = new Map();
                  this._callResolve = callResolveMap;
                  promiseMapEach(this);
                } else {
                  this._result = Array(this._rest);
                  this._callResolve = callResolve;
                  promiseSetEach(this);
                }
              } else {
                var keys = Object.keys(collection);
                this._rest = keys.length;
                this._keys = keys;
                this._result = {};
                this._callResolve = callResolve;
                promiseObjectEach(this);
              }
              if (this._rest === 0) {
                this._promise._resolve(this._result);
              }
              return this;
            };

            Parallel.prototype._execute = function _execute() {
              return this._promise;
            };

            Parallel.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Parallel;
          })(AigleProxy);

          module.exports = { parallel: parallel, Parallel: Parallel };

          /**
           * `Aigle.parallel` functionality is [`Aigle.all`](https://suguru03.github.io/aigle/docs/global.html#all) plus [`Aigle.props`](https://suguru03.github.io/aigle/docs/global.html#props).
           * The function allows an object or an array as the first argument.
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
            return new Parallel(collection)._promise;
          }
        },
        { './aigle': 2, './internal/util': 38, './props': 57, 'aigle-core': 82 }
      ],
      51: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setPickShorthand = ref$1.setPickShorthand;

          var Pick = (function(Each) {
            function Pick(collection, iterator, args) {
              if (typeof iterator !== 'function') {
                iterator = [iterator].concat(args);
              }
              Each.call(this, collection, iterator, set);
              this._result = {};
            }

            if (Each) Pick.__proto__ = Each;
            Pick.prototype = Object.create(Each && Each.prototype);
            Pick.prototype.constructor = Pick;

            return Pick;
          })(Each);

          module.exports = { pick: pick, Pick: Pick };

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
              var key = this._keys[index];
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
          function pick(collection, iterator) {
            var args = [],
              len = arguments.length - 2;
            while (len-- > 0) args[len] = arguments[len + 2];

            return new Pick(collection, iterator, args)._execute();
          }
        },
        { './each': 12, './internal/collection': 35 }
      ],
      52: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var PickBy = (function(Each) {
            function PickBy(collection, iterator) {
              Each.call(this, collection, iterator, set);
              this._result = {};
            }

            if (Each) PickBy.__proto__ = Each;
            PickBy.prototype = Object.create(Each && Each.prototype);
            PickBy.prototype.constructor = PickBy;

            return PickBy;
          })(Each);

          module.exports = { pickBy: pickBy, PickBy: PickBy };

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
              var key = this._keys[index];
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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      53: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;

          var PickByLimit = (function(EachLimit) {
            function PickByLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
              this._result = {};
            }

            if (EachLimit) PickByLimit.__proto__ = EachLimit;
            PickByLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            PickByLimit.prototype.constructor = PickByLimit;

            return PickByLimit;
          })(EachLimit);

          module.exports = { pickByLimit: pickByLimit, PickByLimit: PickByLimit };

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
              var key = this._keys[index];
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
        },
        { './eachLimit': 13, './internal/collection': 35 }
      ],
      54: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;

          var PickBySeries = (function(EachSeries) {
            function PickBySeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
              this._result = {};
            }

            if (EachSeries) PickBySeries.__proto__ = EachSeries;
            PickBySeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            PickBySeries.prototype.constructor = PickBySeries;

            return PickBySeries;
          })(EachSeries);

          module.exports = { pickBySeries: pickBySeries, PickBySeries: PickBySeries };

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
              var key = this._keys[index];
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
        },
        { './eachSeries': 14, './internal/collection': 35 }
      ],
      55: [
        function(require, module, exports) {
          'use strict';

          var Aigle = require('./aigle');
          var ref = require('./internal/util');
          var INTERNAL = ref.INTERNAL;
          var callThen = ref.callThen;

          var globalSetImmediate = typeof setImmediate === 'function' ? setImmediate : {};
          var custom =
            (function() {
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
                var ctx = opts && opts.context !== undefined ? opts.context : undefined;
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
            return function(err, res) {
              return err ? promise._reject(err) : promise._resolve(res);
            };
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
              var arguments$1 = arguments;

              var promise = new Aigle(INTERNAL);
              var callback = makeCallback(promise);
              var l = arguments.length;
              switch (l) {
                case 0:
                  obj[key](callback);
                  break;
                case 1:
                  obj[key](arg, callback);
                  break;
                default:
                  var args = Array(l);
                  while (l--) {
                    args[l] = arguments$1[l];
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
            var func = fn[custom];
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
              var arguments$1 = arguments;

              var promise = new Aigle(INTERNAL);
              var l = arguments.length;
              var p;
              switch (l) {
                case 0:
                  p = func.call(ctx || this);
                  break;
                case 1:
                  p = func.call(ctx || this, arg);
                  break;
                default:
                  var args = Array(l);
                  while (l--) {
                    args[l] = arguments$1[l];
                  }
                  p = func.apply(ctx || this, args);
                  break;
              }
              callThen(p, promise);
              return promise;
            }

            function promisified(arg) {
              var arguments$1 = arguments;

              var promise = new Aigle(INTERNAL);
              var callback = makeCallback(promise);
              var l = arguments.length;
              switch (l) {
                case 0:
                  fn.call(ctx || this, callback);
                  break;
                case 1:
                  fn.call(ctx || this, arg, callback);
                  break;
                default:
                  var args = Array(l);
                  while (l--) {
                    args[l] = arguments$1[l];
                  }
                  args[args.length] = callback;
                  fn.apply(ctx || this, args);
                  break;
              }
              return promise;
            }
          }
        },
        { './aigle': 2, './internal/util': 38, util: 87 }
      ],
      56: [
        function(require, module, exports) {
          'use strict';

          var promisify = require('./promisify');
          var skipMap = {
            constructor: true,
            arity: true,
            length: true,
            name: true,
            arguments: true,
            caller: true,
            callee: true,
            prototype: true,
            __isPromisified__: true
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
           *
           * const key = 'test';
           * redis.hsetAsync(key, 1)
           *   .then(() => redis.hgetAsync(key))
           *   .then(value => console.log(value)); // 1
           */
          function promisifyAll(target, opts) {
            var ref = opts || {};
            var suffix = ref.suffix;
            if (suffix === void 0) suffix = 'Async';
            var filter = ref.filter;
            if (filter === void 0) filter = defaultFilter;
            var depth = ref.depth;
            if (depth === void 0) depth = 2;
            _promisifyAll(suffix, filter, target, undefined, undefined, depth);
            return target;
          }

          function defaultFilter(name) {
            return /^(?!_).*/.test(name);
          }

          function _promisifyAll(suffix, filter, obj, key, target, depth) {
            var memo = {};
            switch (typeof obj) {
              case 'function':
                if (target) {
                  if (obj.__isPromisified__) {
                    return;
                  }
                  var _key = '' + key + suffix;
                  if (target[_key]) {
                    if (!target[_key].__isPromisified__) {
                      throw new TypeError(
                        "Cannot promisify an API that has normal methods with '" + suffix + "'-suffix"
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

          var fp = Function.prototype;
          var op = Object.prototype;
          var ap = Array.prototype;

          function iterate(suffix, filter, obj, target, depth, memo) {
            if (depth-- === 0 || !obj || fp === obj || op === obj || ap === obj || Object.isFrozen(obj)) {
              return;
            }
            var keys = Object.getOwnPropertyNames(obj);
            var l = keys.length;
            while (l--) {
              var key = keys[l];
              if (skipMap[key] === true || memo[key] === true || !filter(key)) {
                continue;
              }
              var desc = Object.getOwnPropertyDescriptor(obj, key);
              if (!desc || desc.set || desc.get) {
                continue;
              }
              memo[key] = true;
              _promisifyAll(suffix, filter, obj[key], key, target, depth);
            }
          }
        },
        { './promisify': 55 }
      ],
      57: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var promiseObjectEach = ref$1.promiseObjectEach;
          var promiseMapEach = ref$1.promiseMapEach;

          var Props = (function(AigleProxy) {
            function Props(object) {
              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._rest = undefined;
              this._result = undefined;
              this._coll = undefined;
              this._keys = undefined;
              if (object === PENDING) {
                this._callResolve = this._set;
              } else {
                this._callResolve = undefined;
                this._set(object);
              }
            }

            if (AigleProxy) Props.__proto__ = AigleProxy;
            Props.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Props.prototype.constructor = Props;

            Props.prototype._set = function _set(object) {
              this._coll = object;
              if (!object || typeof object !== 'object') {
                this._rest = 0;
                this._result = {};
              } else if (object instanceof Map) {
                this._result = new Map();
                this._rest = object.size;
                this._callResolve = callResolveMap;
                promiseMapEach(this);
              } else {
                var keys = Object.keys(object);
                this._result = {};
                this._rest = keys.length;
                this._keys = keys;
                this._callResolve = callResolve;
                promiseObjectEach(this);
              }
              if (this._rest === 0) {
                this._promise._resolve(this._result);
              }
              return this;
            };

            Props.prototype._execute = function _execute() {
              return this._promise;
            };

            Props.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Props;
          })(AigleProxy);

          module.exports = { props: props, Props: Props, callResolve: callResolve, callResolveMap: callResolveMap };

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
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      58: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var promiseArrayEach = ref$1.promiseArrayEach;
          var promiseObjectEach = ref$1.promiseObjectEach;
          var promiseMapEach = ref$1.promiseMapEach;
          var promiseSetEach = ref$1.promiseSetEach;
          var iteratorSymbol = ref$1.iteratorSymbol;

          var Race = (function(AigleProxy) {
            function Race(collection) {
              AigleProxy.call(this);
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

            if (AigleProxy) Race.__proto__ = AigleProxy;
            Race.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Race.prototype.constructor = Race;

            Race.prototype._set = function _set(collection) {
              this._coll = collection;
              this._callResolve = callResolve;
              if (Array.isArray(collection)) {
                var size = collection.length;
                this._rest = size;
                promiseArrayEach(this);
              } else if (!collection || typeof collection !== 'object') {
                this._rest = 0;
              } else if (collection[iteratorSymbol]) {
                this._rest = collection.size;
                if (collection instanceof Map) {
                  this._result = new Map();
                  promiseMapEach(this);
                } else {
                  promiseSetEach(this);
                }
              } else {
                var keys = Object.keys(collection);
                this._result = {};
                this._rest = keys.length;
                this._keys = keys;
                promiseObjectEach(this);
              }
              return this;
            };

            Race.prototype._execute = function _execute() {
              return this._promise;
            };

            Race.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Race;
          })(AigleProxy);

          module.exports = { race: race, Race: Race };

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
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      59: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/collection');
          var execute = ref$1.execute;
          var setSeries = ref$1.setSeries;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var PENDING = ref$2.PENDING;
          var call3 = ref$2.call3;
          var callProxyReciever = ref$2.callProxyReciever;

          var Reduce = (function(AigleProxy) {
            function Reduce(collection, iterator, result) {
              AigleProxy.call(this);
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

            if (AigleProxy) Reduce.__proto__ = AigleProxy;
            Reduce.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Reduce.prototype.constructor = Reduce;

            Reduce.prototype._callResolve = function _callResolve(result, index) {
              if (--this._rest === 0) {
                this._promise._resolve(result);
              } else {
                this._iterate(++index, result);
              }
            };

            Reduce.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Reduce;
          })(AigleProxy);

          module.exports = { reduce: reduce, Reduce: Reduce };

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
            var key = this._keys[index];
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
        },
        { './aigle': 2, './internal/collection': 35, './internal/util': 38, 'aigle-core': 82 }
      ],
      60: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var compactArray = ref$2.compactArray;

          var Reject = (function(Each) {
            function Reject(collection, iterator) {
              Each.call(this, collection, iterator, set);
            }

            if (Each) Reject.__proto__ = Each;
            Reject.prototype = Object.create(Each && Each.prototype);
            Reject.prototype.constructor = Reject;

            return Reject;
          })(Each);

          module.exports = { reject: reject, Reject: Reject };

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
        },
        { './each': 12, './internal/collection': 35, './internal/util': 38 }
      ],
      61: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var compactArray = ref$2.compactArray;

          var RejectLimit = (function(EachLimit) {
            function RejectLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) RejectLimit.__proto__ = EachLimit;
            RejectLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            RejectLimit.prototype.constructor = RejectLimit;

            return RejectLimit;
          })(EachLimit);

          module.exports = { rejectLimit: rejectLimit, RejectLimit: RejectLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35, './internal/util': 38 }
      ],
      62: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var compactArray = ref$2.compactArray;

          var RejectSeries = (function(EachSeries) {
            function RejectSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
            }

            if (EachSeries) RejectSeries.__proto__ = EachSeries;
            RejectSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            RejectSeries.prototype.constructor = RejectSeries;

            return RejectSeries;
          })(EachSeries);

          module.exports = { rejectSeries: rejectSeries, RejectSeries: RejectSeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35, './internal/util': 38 }
      ],
      63: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var call0 = ref$1.call0;
          var callProxyReciever = ref$1.callProxyReciever;
          var DEFAULT_RETRY = 5;

          var Retry = (function(AigleProxy) {
            function Retry(handler, times) {
              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._rest = times;
              this._handler = handler;
              this._iterate();
            }

            if (AigleProxy) Retry.__proto__ = AigleProxy;
            Retry.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Retry.prototype.constructor = Retry;

            Retry.prototype._iterate = function _iterate() {
              callProxyReciever(call0(this._handler), this, undefined);
            };

            Retry.prototype._callResolve = function _callResolve(value) {
              this._promise._resolve(value);
            };

            Retry.prototype._callReject = function _callReject(reason) {
              if (--this._rest === 0) {
                this._promise._reject(reason);
              } else {
                this._iterate();
              }
            };

            return Retry;
          })(AigleProxy);

          module.exports = retry;

          /**
           * @param {Integer} [times=5]
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
           */
          function retry(times, handler) {
            if (typeof times === 'function') {
              handler = times;
              times = DEFAULT_RETRY;
            }
            return new Retry(handler, times)._promise;
          }
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      64: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;

          var Some = (function(Each) {
            function Some(collection, iterator) {
              Each.call(this, collection, iterator, setShorthand);
              this._result = false;
            }

            if (Each) Some.__proto__ = Each;
            Some.prototype = Object.create(Each && Each.prototype);
            Some.prototype.constructor = Some;

            Some.prototype._callResolve = function _callResolve(value) {
              if (value) {
                this._promise._resolve(true);
              } else if (--this._rest === 0) {
                this._promise._resolve(false);
              }
            };

            return Some;
          })(Each);

          module.exports = { some: some, Some: Some };

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
        },
        { './each': 12, './internal/collection': 35 }
      ],
      65: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;

          var SomeLimit = (function(EachLimit) {
            function SomeLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator);
              this._result = false;
            }

            if (EachLimit) SomeLimit.__proto__ = EachLimit;
            SomeLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            SomeLimit.prototype.constructor = SomeLimit;

            SomeLimit.prototype._callResolve = function _callResolve(value) {
              if (value) {
                this._promise._resolve(true);
              } else if (--this._rest === 0) {
                this._promise._resolve(false);
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            return SomeLimit;
          })(EachLimit);

          module.exports = { someLimit: someLimit, SomeLimit: SomeLimit };

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
        },
        { './eachLimit': 13 }
      ],
      66: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries.js');
          var EachSeries = ref.EachSeries;

          var SomeSeries = (function(EachSeries) {
            function SomeSeries(collection, iterator) {
              EachSeries.call(this, collection, iterator);
              this._result = false;
            }

            if (EachSeries) SomeSeries.__proto__ = EachSeries;
            SomeSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            SomeSeries.prototype.constructor = SomeSeries;

            SomeSeries.prototype._callResolve = function _callResolve(value) {
              if (value) {
                this._promise._resolve(true);
              } else if (--this._rest === 0) {
                this._promise._resolve(false);
              } else {
                this._iterate();
              }
            };

            return SomeSeries;
          })(EachSeries);

          module.exports = { someSeries: someSeries, SomeSeries: SomeSeries };

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
        },
        { './eachSeries.js': 14 }
      ],
      67: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setShorthand = ref$1.setShorthand;
          var ref$2 = require('./internal/util');
          var sortArray = ref$2.sortArray;
          var sortObject = ref$2.sortObject;

          var SortBy = (function(Each) {
            function SortBy(collection, iterator) {
              Each.call(this, collection, iterator, set);
            }

            if (Each) SortBy.__proto__ = Each;
            SortBy.prototype = Object.create(Each && Each.prototype);
            SortBy.prototype.constructor = SortBy;

            return SortBy;
          })(Each);

          module.exports = { sortBy: sortBy, SortBy: SortBy };

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
        },
        { './each': 12, './internal/collection': 35, './internal/util': 38 }
      ],
      68: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;
          var ref$2 = require('./internal/util');
          var sortArray = ref$2.sortArray;
          var sortObject = ref$2.sortObject;

          var SortByLimit = (function(EachLimit) {
            function SortByLimit(collection, limit, iterator) {
              EachLimit.call(this, collection, limit, iterator, set);
            }

            if (EachLimit) SortByLimit.__proto__ = EachLimit;
            SortByLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            SortByLimit.prototype.constructor = SortByLimit;

            return SortByLimit;
          })(EachLimit);

          module.exports = { sortByLimit: sortByLimit, SortByLimit: SortByLimit };

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
        },
        { './eachLimit': 13, './internal/collection': 35, './internal/util': 38 }
      ],
      69: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;
          var ref$2 = require('./internal/util');
          var sortArray = ref$2.sortArray;
          var sortObject = ref$2.sortObject;

          var SortBySeries = (function(EachSeries) {
            function SortBySeries(collection, iterator) {
              EachSeries.call(this, collection, iterator, set);
            }

            if (EachSeries) SortBySeries.__proto__ = EachSeries;
            SortBySeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            SortBySeries.prototype.constructor = SortBySeries;

            return SortBySeries;
          })(EachSeries);

          module.exports = { sortBySeries: sortBySeries, SortBySeries: SortBySeries };

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
        },
        { './eachSeries': 14, './internal/collection': 35, './internal/util': 38 }
      ],
      70: [
        function(require, module, exports) {
          'use strict';

          var Aigle = require('./aigle');
          var ref = require('./internal/util');
          var INTERNAL = ref.INTERNAL;
          var callResolve = ref.callResolve;

          // TODO refactor
          function tap(value, onFulfilled) {
            var promise = new Aigle(INTERNAL);
            callResolve(promise, onFulfilled, value);
            return promise.then(function() {
              return value;
            });
          }

          module.exports = tap;
        },
        { './aigle': 2, './internal/util': 38 }
      ],
      71: [
        function(require, module, exports) {
          'use strict';

          var Aigle = require('./aigle');
          var ref = require('./internal/util');
          var INTERNAL = ref.INTERNAL;
          var callResolve = ref.callResolve;

          function thru(value, onFulfilled) {
            var promise = new Aigle(INTERNAL);
            callResolve(promise, onFulfilled, value);
            return promise;
          }

          module.exports = thru;
        },
        { './aigle': 2, './internal/util': 38 }
      ],
      72: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./error');
          var TimeoutError = ref$1.TimeoutError;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;

          var Timeout = (function(AigleProxy) {
            function Timeout(ms, message) {
              var this$1 = this;

              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._message = message;
              this._timer = setTimeout(function() {
                if (message) {
                  this$1._callReject(message);
                } else {
                  this$1._callReject(new TimeoutError('operation timed out'));
                }
              }, ms);
            }

            if (AigleProxy) Timeout.__proto__ = AigleProxy;
            Timeout.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Timeout.prototype.constructor = Timeout;

            Timeout.prototype._callResolve = function _callResolve(value) {
              clearTimeout(this._timer);
              this._promise._resolve(value);
            };

            Timeout.prototype._callReject = function _callReject(reason) {
              clearTimeout(this._timer);
              this._promise._reject(reason);
            };

            return Timeout;
          })(AigleProxy);

          module.exports = Timeout;
        },
        { './aigle': 2, './error': 15, './internal/util': 38, 'aigle-core': 82 }
      ],
      73: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var defaultIterator = ref$1.defaultIterator;
          var call1 = ref$1.call1;
          var callProxyReciever = ref$1.callProxyReciever;

          var Times = (function(AigleProxy) {
            function Times(times, iterator) {
              AigleProxy.call(this);
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

            if (AigleProxy) Times.__proto__ = AigleProxy;
            Times.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Times.prototype.constructor = Times;

            Times.prototype._execute = function _execute() {
              if (this._rest >= 1) {
                var ref = this;
                var _rest = ref._rest;
                var _iterator = ref._iterator;
                var i = -1;
                while (++i < _rest && callProxyReciever(call1(_iterator, i), this, i)) {}
              } else {
                this._promise._resolve(this._result);
              }
              return this._promise;
            };

            Times.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(this._result);
              }
            };

            Times.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return Times;
          })(AigleProxy);

          module.exports = { times: times, Times: Times, set: set, execute: execute };

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
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      74: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var PENDING = ref$1.PENDING;
          var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
          var defaultIterator = ref$1.defaultIterator;
          var call1 = ref$1.call1;
          var callProxyReciever = ref$1.callProxyReciever;

          var TimesLimit = (function(AigleProxy) {
            function TimesLimit(times, limit, iterator) {
              AigleProxy.call(this);
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

            if (AigleProxy) TimesLimit.__proto__ = AigleProxy;
            TimesLimit.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            TimesLimit.prototype.constructor = TimesLimit;

            TimesLimit.prototype._execute = function _execute() {
              var this$1 = this;

              if (this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                while (this._limit--) {
                  this$1._iterate();
                }
              }
              return this._promise;
            };

            TimesLimit.prototype._iterate = function _iterate() {
              var i = this._index++;
              callProxyReciever(call1(this._iterator, i), this, i);
            };

            TimesLimit.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            TimesLimit.prototype._callReject = function _callReject(reason) {
              this._callRest = 0;
              this._promise._reject(reason);
            };

            return TimesLimit;
          })(AigleProxy);

          module.exports = { timesLimit: timesLimit, TimesLimit: TimesLimit };

          function set(times) {
            times = +times | 0;
            if (times >= 1) {
              this._rest = times;
              this._result = Array(times);
              var ref = this;
              var _limit = ref._limit;
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
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      75: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./times');
          var set = ref$1.set;
          var execute = ref$1.execute;
          var ref$2 = require('./internal/util');
          var INTERNAL = ref$2.INTERNAL;
          var PENDING = ref$2.PENDING;
          var defaultIterator = ref$2.defaultIterator;
          var call1 = ref$2.call1;
          var callProxyReciever = ref$2.callProxyReciever;

          var TimesSeries = (function(AigleProxy) {
            function TimesSeries(times, iterator) {
              AigleProxy.call(this);
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

            if (AigleProxy) TimesSeries.__proto__ = AigleProxy;
            TimesSeries.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            TimesSeries.prototype.constructor = TimesSeries;

            TimesSeries.prototype._execute = function _execute() {
              if (this._rest >= 1) {
                this._iterate();
              } else {
                this._promise._resolve(this._result);
              }
              return this._promise;
            };

            TimesSeries.prototype._iterate = function _iterate() {
              var i = this._index++;
              callProxyReciever(call1(this._iterator, i), this, i);
            };

            TimesSeries.prototype._callResolve = function _callResolve(value, index) {
              this._result[index] = value;
              if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                this._iterate();
              }
            };

            TimesSeries.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return TimesSeries;
          })(AigleProxy);

          module.exports = { timesSeries: timesSeries, TimesSeries: TimesSeries };

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
        },
        { './aigle': 2, './internal/util': 38, './times': 73, 'aigle-core': 82 }
      ],
      76: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./each');
          var Each = ref.Each;
          var ref$1 = require('./internal/collection');
          var setParallel = ref$1.setParallel;
          var ref$2 = require('./internal/util');
          var call3 = ref$2.call3;
          var callProxyReciever = ref$2.callProxyReciever;
          var clone = ref$2.clone;

          var Transform = (function(Each) {
            function Transform(collection, iterator, accumulator) {
              Each.call(this, collection, iterator, set);
              if (accumulator !== undefined) {
                this._result = accumulator;
              }
            }

            if (Each) Transform.__proto__ = Each;
            Transform.prototype = Object.create(Each && Each.prototype);
            Transform.prototype.constructor = Transform;

            Transform.prototype._callResolve = function _callResolve(bool) {
              if (bool === false) {
                this._promise._resolve(clone(this._result));
              } else if (--this._rest === 0) {
                this._promise._resolve(this._result);
              }
            };

            return Transform;
          })(Each);

          module.exports = { transform: transform, Transform: Transform };

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
            var ref = this;
            var _rest = ref._rest;
            var _result = ref._result;
            var _iterator = ref._iterator;
            var _coll = ref._coll;
            var i = -1;
            while (++i < _rest && callProxyReciever(call3(_iterator, _result, _coll[i], i), this, i)) {}
          }

          function iterateObject() {
            var this$1 = this;

            var ref = this;
            var _rest = ref._rest;
            var _result = ref._result;
            var _iterator = ref._iterator;
            var _coll = ref._coll;
            var _keys = ref._keys;
            var i = -1;
            while (++i < _rest) {
              var key = _keys[i];
              if (callProxyReciever(call3(_iterator, _result, _coll[key], key), this$1, i) === false) {
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
        },
        { './each': 12, './internal/collection': 35, './internal/util': 38 }
      ],
      77: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachLimit');
          var EachLimit = ref.EachLimit;
          var ref$1 = require('./internal/collection');
          var setLimit = ref$1.setLimit;
          var ref$2 = require('./internal/util');
          var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
          var call3 = ref$2.call3;
          var callProxyReciever = ref$2.callProxyReciever;
          var clone = ref$2.clone;

          var TransformLimit = (function(EachLimit) {
            function TransformLimit(collection, limit, iterator, accumulator) {
              if (typeof limit === 'function') {
                accumulator = iterator;
                iterator = limit;
                limit = DEFAULT_LIMIT;
              }
              EachLimit.call(this, collection, limit, iterator, set);
              if (accumulator !== undefined) {
                this._result = accumulator;
              }
            }

            if (EachLimit) TransformLimit.__proto__ = EachLimit;
            TransformLimit.prototype = Object.create(EachLimit && EachLimit.prototype);
            TransformLimit.prototype.constructor = TransformLimit;

            TransformLimit.prototype._callResolve = function _callResolve(bool) {
              if (bool === false) {
                this._promise._resolve(clone(this._result));
              } else if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else if (this._callRest-- > 0) {
                this._iterate();
              }
            };

            return TransformLimit;
          })(EachLimit);

          module.exports = { transformLimit: transformLimit, TransformLimit: TransformLimit };

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
            var index = this._index++;
            callProxyReciever(call3(this._iterator, this._result, this._coll[index], index), this, index);
          }

          function iterateObject() {
            var index = this._index++;
            var key = this._keys[index];
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
        },
        { './eachLimit': 13, './internal/collection': 35, './internal/util': 38 }
      ],
      78: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./eachSeries');
          var EachSeries = ref.EachSeries;
          var ref$1 = require('./internal/collection');
          var setSeries = ref$1.setSeries;
          var ref$2 = require('./internal/util');
          var call3 = ref$2.call3;
          var callProxyReciever = ref$2.callProxyReciever;
          var clone = ref$2.clone;

          var TransformSeries = (function(EachSeries) {
            function TransformSeries(collection, iterator, accumulator) {
              EachSeries.call(this, collection, iterator, set);
              if (accumulator !== undefined) {
                this._result = accumulator;
              }
            }

            if (EachSeries) TransformSeries.__proto__ = EachSeries;
            TransformSeries.prototype = Object.create(EachSeries && EachSeries.prototype);
            TransformSeries.prototype.constructor = TransformSeries;

            TransformSeries.prototype._callResolve = function _callResolve(bool) {
              if (bool === false) {
                this._promise._resolve(clone(this._result));
              } else if (--this._rest === 0) {
                this._promise._resolve(this._result);
              } else {
                this._iterate();
              }
            };

            return TransformSeries;
          })(EachSeries);

          module.exports = { transformSeries: transformSeries, TransformSeries: TransformSeries };

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
            var index = this._index++;
            callProxyReciever(call3(this._iterator, this._result, this._coll[index], index), this, index);
          }

          function iterateObject() {
            var index = this._index++;
            var key = this._keys[index];
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
        },
        { './eachSeries': 14, './internal/collection': 35, './internal/util': 38 }
      ],
      79: [
        function(require, module, exports) {
          'use strict';

          var ref = require('./whilst');
          var AigleWhilst = ref.AigleWhilst;
          var WhilstTester = ref.WhilstTester;

          var UntilTester = (function(WhilstTester) {
            function UntilTester(tester) {
              WhilstTester.call(this, tester);
            }

            if (WhilstTester) UntilTester.__proto__ = WhilstTester;
            UntilTester.prototype = Object.create(WhilstTester && WhilstTester.prototype);
            UntilTester.prototype.constructor = UntilTester;

            UntilTester.prototype._callResolve = function _callResolve(value) {
              if (value) {
                this._proxy._promise._resolve(this._value);
              } else {
                this._proxy._next(this._value);
              }
            };

            return UntilTester;
          })(WhilstTester);

          module.exports = { until: until, UntilTester: UntilTester };

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
        },
        { './whilst': 81 }
      ],
      80: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var apply = ref$1.apply;
          var call1 = ref$1.call1;
          var callProxyReciever = ref$1.callProxyReciever;

          var DISPOSER = {};

          var Disposer = function Disposer(promise, handler) {
            this._promise = promise;
            this._handler = handler;
          };

          Disposer.prototype._dispose = function _dispose() {
            var this$1 = this;

            var ref = this;
            var _promise = ref._promise;
            switch (_promise._resolved) {
              case 0:
                return _promise.then(function() {
                  return this$1._dispose();
                });
              case 1:
                return call1(this._handler, this._promise._value);
            }
          };

          var Using = (function(AigleProxy) {
            function Using(array, handler) {
              var this$1 = this;

              AigleProxy.call(this);
              var size = array.length;
              this._promise = new Aigle(INTERNAL);
              this._rest = size;
              this._disposed = size;
              this._array = array;
              this._error = undefined;
              this._result = Array(size);
              this._handler = handler;
              var i = -1;
              while (++i < size) {
                var disposer = array[i];
                if (disposer instanceof Disposer === false) {
                  callProxyReciever(disposer, this$1, i);
                } else {
                  callProxyReciever(disposer._promise, this$1, i);
                }
              }
            }

            if (AigleProxy) Using.__proto__ = AigleProxy;
            Using.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            Using.prototype.constructor = Using;

            Using.prototype._spread = function _spread() {
              var ref = this;
              var _handler = ref._handler;
              var _result = ref._result;
              if (typeof _handler !== 'function') {
                return this._callResolve(undefined, INTERNAL);
              }
              callProxyReciever(apply(_handler, _result), this, INTERNAL);
            };

            Using.prototype._release = function _release() {
              var this$1 = this;

              var ref = this;
              var _array = ref._array;
              var l = _array.length;
              while (l--) {
                var disposer = _array[l];
                if (disposer instanceof Disposer === false) {
                  this$1._callResolve(disposer, DISPOSER);
                } else {
                  callProxyReciever(disposer._dispose(), this$1, DISPOSER);
                }
              }
            };

            Using.prototype._callResolve = function _callResolve(value, index) {
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
            };

            Using.prototype._callReject = function _callReject(reason) {
              if (this._error) {
                return this._promise._reject(reason);
              }
              this._error = reason;
              this._release();
            };

            return Using;
          })(AigleProxy);

          module.exports = { using: using, Disposer: Disposer };

          function using() {
            var arguments$1 = arguments;

            var l = arguments.length;
            var handler = arguments[--l];
            var array = Array(l);
            while (l--) {
              array[l] = arguments$1[l];
            }
            return new Using(array, handler)._promise;
          }
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      81: [
        function(require, module, exports) {
          'use strict';

          var ref = require('aigle-core');
          var AigleProxy = ref.AigleProxy;

          var Aigle = require('./aigle');
          var ref$1 = require('./internal/util');
          var INTERNAL = ref$1.INTERNAL;
          var callProxyReciever = ref$1.callProxyReciever;
          var call1 = ref$1.call1;

          var WhilstTester = (function(AigleProxy) {
            function WhilstTester(tester) {
              AigleProxy.call(this);
              this._tester = tester;
              this._proxy = undefined;
              this._value = undefined;
            }

            if (AigleProxy) WhilstTester.__proto__ = AigleProxy;
            WhilstTester.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            WhilstTester.prototype.constructor = WhilstTester;

            WhilstTester.prototype._test = function _test(value) {
              this._value = value;
              callProxyReciever(call1(this._tester, value), this, undefined);
            };

            WhilstTester.prototype._callResolve = function _callResolve(value) {
              if (value) {
                this._proxy._next(this._value);
              } else {
                this._proxy._promise._resolve(this._value);
              }
            };

            WhilstTester.prototype._callReject = function _callReject(reason) {
              this._proxy._callReject(reason);
            };

            return WhilstTester;
          })(AigleProxy);

          var AigleWhilst = (function(AigleProxy) {
            function AigleWhilst(tester, iterator) {
              AigleProxy.call(this);
              this._promise = new Aigle(INTERNAL);
              this._tester = tester;
              this._iterator = iterator;
              tester._proxy = this;
            }

            if (AigleProxy) AigleWhilst.__proto__ = AigleProxy;
            AigleWhilst.prototype = Object.create(AigleProxy && AigleProxy.prototype);
            AigleWhilst.prototype.constructor = AigleWhilst;

            AigleWhilst.prototype._iterate = function _iterate(value) {
              this._callResolve(value);
              return this._promise;
            };

            AigleWhilst.prototype._next = function _next(value) {
              callProxyReciever(call1(this._iterator, value), this, undefined);
            };

            AigleWhilst.prototype._callResolve = function _callResolve(value) {
              this._tester._test(value);
            };

            AigleWhilst.prototype._callReject = function _callReject(reason) {
              this._promise._reject(reason);
            };

            return AigleWhilst;
          })(AigleProxy);

          module.exports = { whilst: whilst, AigleWhilst: AigleWhilst, WhilstTester: WhilstTester };

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
        },
        { './aigle': 2, './internal/util': 38, 'aigle-core': 82 }
      ],
      82: [
        function(require, module, exports) {
          'use strict';

          var AigleCore = function AigleCore() {};

          var AigleProxy = function AigleProxy() {};

          module.exports = { AigleCore: AigleCore, AigleProxy: AigleProxy };
        },
        {}
      ],
      83: [
        function(require, module, exports) {
          // shim for using process in browser
          var process = (module.exports = {});

          // cached from whatever global is present so that test runners that stub it
          // don't break things.  But we need to wrap it in a try catch in case it is
          // wrapped in strict mode code which doesn't define any globals.  It's inside a
          // function because try/catches deoptimize in certain engines.

          var cachedSetTimeout;
          var cachedClearTimeout;

          function defaultSetTimout() {
            throw new Error('setTimeout has not been defined');
          }
          function defaultClearTimeout() {
            throw new Error('clearTimeout has not been defined');
          }
          (function() {
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
          })();
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
            } catch (e) {
              try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
              } catch (e) {
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
            } catch (e) {
              try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
              } catch (e) {
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
            while (len) {
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

          process.nextTick = function(fun) {
            var arguments$1 = arguments;

            var args = new Array(arguments.length - 1);
            if (arguments.length > 1) {
              for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments$1[i];
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
          Item.prototype.run = function() {
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

          process.listeners = function(name) {
            return [];
          };

          process.binding = function(name) {
            throw new Error('process.binding is not supported');
          };

          process.cwd = function() {
            return '/';
          };
          process.chdir = function(dir) {
            throw new Error('process.chdir is not supported');
          };
          process.umask = function() {
            return 0;
          };
        },
        {}
      ],
      84: [
        function(require, module, exports) {
          (function(process, global) {
            (function(global, undefined) {
              'use strict';

              if (global.setImmediate) {
                return;
              }

              var nextHandle = 1; // Spec says greater than zero
              var tasksByHandle = {};
              var currentlyRunningATask = false;
              var doc = global.document;
              var registerImmediate;

              function setImmediate(callback) {
                var arguments$1 = arguments;

                // Callback can either be a function or a string
                if (typeof callback !== 'function') {
                  callback = new Function('' + callback);
                }
                // Copy function arguments
                var args = new Array(arguments.length - 1);
                for (var i = 0; i < args.length; i++) {
                  args[i] = arguments$1[i + 1];
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
                  process.nextTick(function() {
                    runIfPresent(handle);
                  });
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
                  global.postMessage('', '*');
                  global.onmessage = oldOnMessage;
                  return postMessageIsAsynchronous;
                }
              }

              function installPostMessageImplementation() {
                // Installs an event handler on `global` for the `message` event: see
                // * https://developer.mozilla.org/en/DOM/window.postMessage
                // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

                var messagePrefix = 'setImmediate$' + Math.random() + '$';
                var onGlobalMessage = function(event) {
                  if (
                    event.source === global &&
                    typeof event.data === 'string' &&
                    event.data.indexOf(messagePrefix) === 0
                  ) {
                    runIfPresent(+event.data.slice(messagePrefix.length));
                  }
                };

                if (global.addEventListener) {
                  global.addEventListener('message', onGlobalMessage, false);
                } else {
                  global.attachEvent('onmessage', onGlobalMessage);
                }

                registerImmediate = function(handle) {
                  global.postMessage(messagePrefix + handle, '*');
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
                  var script = doc.createElement('script');
                  script.onreadystatechange = function() {
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
              if ({}.toString.call(global.process) === '[object process]') {
                // For Node.js before 0.9
                installNextTickImplementation();
              } else if (canUsePostMessage()) {
                // For non-IE10 modern browsers
                installPostMessageImplementation();
              } else if (global.MessageChannel) {
                // For web workers, where supported
                installMessageChannelImplementation();
              } else if (doc && 'onreadystatechange' in doc.createElement('script')) {
                // For IE 6–8
                installReadyStateChangeImplementation();
              } else {
                // For older browsers
                installSetTimeoutImplementation();
              }

              attachTo.setImmediate = setImmediate;
              attachTo.clearImmediate = clearImmediate;
            })(typeof self === 'undefined' ? (typeof global === 'undefined' ? this : global) : self);
          }.call(
            this,
            require('_process'),
            typeof global !== 'undefined'
              ? global
              : typeof self !== 'undefined'
                ? self
                : typeof window !== 'undefined'
                  ? window
                  : {}
          ));
        },
        { _process: 83 }
      ],
      85: [
        function(require, module, exports) {
          if (typeof Object.create === 'function') {
            // implementation from standard node.js 'util' module
            module.exports = function inherits(ctor, superCtor) {
              ctor.super_ = superCtor;
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
              ctor.super_ = superCtor;
              var TempCtor = function() {};
              TempCtor.prototype = superCtor.prototype;
              ctor.prototype = new TempCtor();
              ctor.prototype.constructor = ctor;
            };
          }
        },
        {}
      ],
      86: [
        function(require, module, exports) {
          module.exports = function isBuffer(arg) {
            return (
              arg &&
              typeof arg === 'object' &&
              typeof arg.copy === 'function' &&
              typeof arg.fill === 'function' &&
              typeof arg.readUInt8 === 'function'
            );
          };
        },
        {}
      ],
      87: [
        function(require, module, exports) {
          (function(process, global) {
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
              var arguments$1 = arguments;

              if (!isString(f)) {
                var objects = [];
                for (var i = 0; i < arguments.length; i++) {
                  objects.push(inspect(arguments$1[i]));
                }
                return objects.join(' ');
              }

              var i = 1;
              var args = arguments;
              var len = args.length;
              var str = String(f).replace(formatRegExp, function(x) {
                if (x === '%%') {
                  return '%';
                }
                if (i >= len) {
                  return x;
                }
                switch (x) {
                  case '%s':
                    return String(args[i++]);
                  case '%d':
                    return Number(args[i++]);
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
              if (isUndefined(debugEnviron)) {
                debugEnviron = process.env.NODE_DEBUG || '';
              }
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
              if (arguments.length >= 3) {
                ctx.depth = arguments[2];
              }
              if (arguments.length >= 4) {
                ctx.colors = arguments[3];
              }
              if (isBoolean(opts)) {
                // legacy...
                ctx.showHidden = opts;
              } else if (opts) {
                // got an "options" object
                exports._extend(ctx, opts);
              }
              // set default options
              if (isUndefined(ctx.showHidden)) {
                ctx.showHidden = false;
              }
              if (isUndefined(ctx.depth)) {
                ctx.depth = 2;
              }
              if (isUndefined(ctx.colors)) {
                ctx.colors = false;
              }
              if (isUndefined(ctx.customInspect)) {
                ctx.customInspect = true;
              }
              if (ctx.colors) {
                ctx.stylize = stylizeWithColor;
              }
              return formatValue(ctx, obj, ctx.depth);
            }
            exports.inspect = inspect;

            // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
            inspect.colors = {
              bold: [1, 22],
              italic: [3, 23],
              underline: [4, 24],
              inverse: [7, 27],
              white: [37, 39],
              grey: [90, 39],
              black: [30, 39],
              blue: [34, 39],
              cyan: [36, 39],
              green: [32, 39],
              magenta: [35, 39],
              red: [31, 39],
              yellow: [33, 39]
            };

            // Don't use 'blue' not visible on cmd.exe
            inspect.styles = {
              special: 'cyan',
              number: 'yellow',
              boolean: 'yellow',
              undefined: 'grey',
              null: 'bold',
              string: 'green',
              date: 'magenta',
              // "name": intentionally not styling
              regexp: 'red'
            };

            function stylizeWithColor(str, styleType) {
              var style = inspect.styles[styleType];

              if (style) {
                return '\u001b[' + inspect.colors[style][0] + 'm' + str + '\u001b[' + inspect.colors[style][1] + 'm';
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
              if (
                ctx.customInspect &&
                value &&
                isFunction(value.inspect) &&
                // Filter out the util module, it's inspect function is special
                value.inspect !== exports.inspect &&
                // Also filter out any prototype objects using the circular check.
                !(value.constructor && value.constructor.prototype === value)
              ) {
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
              if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
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

              var base = '',
                array = false,
                braces = ['{', '}'];

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
              if (isUndefined(value)) {
                return ctx.stylize('undefined', 'undefined');
              }
              if (isString(value)) {
                var simple =
                  "'" +
                  JSON.stringify(value)
                    .replace(/^"|"$/g, '')
                    .replace(/'/g, "\\'")
                    .replace(/\\"/g, '"') +
                  "'";
                return ctx.stylize(simple, 'string');
              }
              if (isNumber(value)) {
                return ctx.stylize('' + value, 'number');
              }
              if (isBoolean(value)) {
                return ctx.stylize('' + value, 'boolean');
              }
              // For some reason typeof null is "object", so special case here.
              if (isNull(value)) {
                return ctx.stylize('null', 'null');
              }
            }

            function formatError(value) {
              return '[' + Error.prototype.toString.call(value) + ']';
            }

            function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
              var output = [];
              for (var i = 0, l = value.length; i < l; ++i) {
                if (hasOwnProperty(value, String(i))) {
                  output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
                } else {
                  output.push('');
                }
              }
              keys.forEach(function(key) {
                if (!key.match(/^\d+$/)) {
                  output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
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
                      str = str
                        .split('\n')
                        .map(function(line) {
                          return '  ' + line;
                        })
                        .join('\n')
                        .substr(2);
                    } else {
                      str =
                        '\n' +
                        str
                          .split('\n')
                          .map(function(line) {
                            return '   ' + line;
                          })
                          .join('\n');
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
                  name = name
                    .replace(/'/g, "\\'")
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
                if (cur.indexOf('\n') >= 0) {
                  numLinesEst++;
                }
                return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
              }, 0);

              if (length > 60) {
                return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
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
              return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
            }
            exports.isError = isError;

            function isFunction(arg) {
              return typeof arg === 'function';
            }
            exports.isFunction = isFunction;

            function isPrimitive(arg) {
              return (
                arg === null ||
                typeof arg === 'boolean' ||
                typeof arg === 'number' ||
                typeof arg === 'string' ||
                typeof arg === 'symbol' || // ES6 symbol
                typeof arg === 'undefined'
              );
            }
            exports.isPrimitive = isPrimitive;

            exports.isBuffer = require('./support/isBuffer');

            function objectToString(o) {
              return Object.prototype.toString.call(o);
            }

            function pad(n) {
              return n < 10 ? '0' + n.toString(10) : n.toString(10);
            }

            var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // 26 Feb 16:19:34
            function timestamp() {
              var d = new Date();
              var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
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
              if (!add || !isObject(add)) {
                return origin;
              }

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
          }.call(
            this,
            require('_process'),
            typeof global !== 'undefined'
              ? global
              : typeof self !== 'undefined'
                ? self
                : typeof window !== 'undefined'
                  ? window
                  : {}
          ));
        },
        { './support/isBuffer': 86, _process: 83, inherits: 85 }
      ],
      88: [
        function(require, module, exports) {
          module.exports = {
            name: 'aigle',
            version: '1.13.0-alpha.0',
            description: 'Aigle is an ideal Promise library, faster and more functional than other Promise libraries',
            main: 'index.js',
            typings: 'aigle.d.ts',
            private: true,
            browser: 'browser.js',
            scripts: {
              bench: 'node --expose_gc ./benchmark -d',
              eslint: 'eslint . --ext .js',
              test: 'DELAY=50 npm-run-all -p eslint test:type test:cov',
              'test:mocha': 'mocha test/**/*.js',
              'test:cov': 'nyc npm run test:mocha',
              'test:type': 'cd typings && tsc',
              codecov: 'nyc report --reporter=lcovonly && codecov',
              prettier:
                "prettier --write './benchmark/**/*.js' './gulp/**/*.js' './lib/**/*.js' './test/**/*.js' './typings/**/*.ts'",
              precommit: 'lint-staged'
            },
            homepage: 'https://github.com/suguru03/aigle',
            keywords: ['aigle', 'promise', 'async'],
            files: ['README.md', 'index.js', 'lib/', 'browser.js', 'dist/'],
            author: 'Suguru Motegi',
            license: 'MIT',
            devDependencies: {
              babili: '0.1.4',
              benchmark: '^2.1.1',
              bluebird: '^3.5.1',
              browserify: '^16.0.0',
              buble: '^0.19.0',
              codecov: '^3.0.0',
              docdash: '^0.4.0',
              eslint: '^4.19.1',
              'fs-extra': '^6.0.0',
              gulp: '^3.9.1',
              'gulp-bump': '^3.0.0',
              'gulp-git': '^2.4.2',
              'gulp-tag-version': '^1.3.0',
              husky: '^0.14.3',
              jsdoc: '^3.5.5',
              'lint-staged': '^7.0.0',
              lodash: '^4.15.0',
              minimist: '^1.2.0',
              mocha: '^5.0.0',
              'mocha.parallel': '0.15.5',
              'neo-async': '^2.5.0',
              'npm-run-all': '^4.1.2',
              nyc: '^11.4.1',
              prettier: '^1.11.1',
              'require-dir': '^1.0.0',
              'run-sequence': '^2.0.0',
              semver: '^5.5.0',
              setimmediate: '^1.0.5',
              tslint: '^5.9.1',
              typescript: '^2.7.2',
              'uglify-js': '^3.1.5'
            },
            dependencies: {
              'aigle-core': '^1.0.0'
            },
            'lint-staged': {
              '*.{js,ts}': ['prettier --write', 'git add']
            },
            prettier: {
              printWidth: 120,
              singleQuote: true
            }
          };
        },
        {}
      ]
    },
    {},
    [1]
  )(1);
});
