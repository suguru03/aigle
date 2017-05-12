(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Promise = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a){ return a(o,!0); }if(i){ return i(o,!0); }var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++){ s(r[o]); }return s})({1:[function(require,module,exports){
'use strict';

require('setimmediate');
module.exports = require('./lib/aigle');

},{"./lib/aigle":2,"setimmediate":73}],2:[function(require,module,exports){
(function (process){
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
var errorObj = ref$1.errorObj;
var call0 = ref$1.call0;
var callResolve = ref$1.callResolve;
var callReject = ref$1.callReject;
var stackTraces = false;

var Aigle = (function (AigleCore) {
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
    execute(this, executor);
  }

  if ( AigleCore ) Aigle.__proto__ = AigleCore;
  Aigle.prototype = Object.create( AigleCore && AigleCore.prototype );
  Aigle.prototype.constructor = Aigle;

  /**
   * @return {string}
   */
  Aigle.prototype.toString = function toString () {
    return '[object Promise]';
  };

  /**
   * @param {Function} onFulfilled
   * @param {Function} [onRejected]
   * @return {Aigle} Returns an Aigle instance
   */
  Aigle.prototype.then = function then (onFulfilled, onRejected) {
    return addAigle(this, new Aigle(INTERNAL), onFulfilled, onRejected);
  };

  /**
   * @param {Object|Function} onRejected
   * @return {Aigle} Returns an Aigle instance
   * @example
   * return Aigle.reject(new TypeError('error'))
   *   .catch(TypeError, error => console.log(error));
   */
  Aigle.prototype.catch = function catch$1 (onRejected) {
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
  Aigle.prototype.finally = function finally$1 (handler) {
    handler = typeof handler !== 'function' ? handler : createFinallyHandler(this, handler);
    return addAigle(this, new Aigle(INTERNAL), handler, handler);
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
  Aigle.prototype.spread = function spread (handler) {
    return addReceiver(this, new Spread(handler));
  };

  /**
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
  Aigle.prototype.all = function all () {
    return addProxy(this, AigleAll);
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
  Aigle.prototype.race = function race$1 () {
    return this.then(race);
  };

  /**
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
  Aigle.prototype.props = function props$1 () {
    return this.then(props);
  };

  /**
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
  Aigle.prototype.parallel = function parallel () {
    return addProxy(this, AigleParallel);
  };

  /**
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
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
   * const iterator = num => {
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
   * const iterator = num => {
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
  Aigle.prototype.each = function each (iterator) {
    return addProxy(this, Each, iterator);
  };

  /**
   * @alias each
   * @param {Function} iterator
   */
  Aigle.prototype.forEach = function forEach (iterator) {
    return addProxy(this, Each, iterator);
  };

  /**
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
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
   * const iterator = num => {
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
  Aigle.prototype.eachSeries = function eachSeries (iterator) {
    return addProxy(this, EachSeries, iterator);
  };

  /**
   * @alias eachSeries
   * @param {Function} iterator
   */
  Aigle.prototype.forEachSeries = function forEachSeries (iterator) {
    return addProxy(this, EachSeries, iterator);
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const collection = [1, 5, 3, 4, 2];
   * return Aigle.resolve(collection)
   *   .eachLimit(2, num => {
   *     return new Aigle(resolve => setTimeout(() => {
   *       console.log(num); // 1, 3, 5, 2, 4
   *       resolve(num);
   *     }, num * 10));
   *   });
   *
   * @example
   * const collection = [1, 5, 3, 4, 2];
   * return Aigle.resolve(collection)
   *   .eachLimit(num => {
   *     return new Aigle(resolve => setTimeout(() => {
   *       console.log(num); // 1, 2, 3, 4, 5
   *       resolve(num);
   *     }, num * 10));
   *   });
   */
  Aigle.prototype.eachLimit = function eachLimit (limit, iterator) {
    return addProxy(this, EachLimit, limit, iterator);
  };

  /**
   * @alias eachLimit
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.forEachLimit = function forEachLimit (limit, iterator) {
    return addProxy(this, EachLimit, limit, iterator);
  };

  /**
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
  Aigle.prototype.map = function map (iterator) {
    return addProxy(this, Map, iterator);
  };

  /**
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
  Aigle.prototype.mapSeries = function mapSeries (iterator) {
    return addProxy(this, MapSeries, iterator);
  };

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
  Aigle.prototype.mapLimit = function mapLimit (limit, iterator) {
    return addProxy(this, MapLimit, limit, iterator);
  };

  /**
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
  Aigle.prototype.mapValues = function mapValues (iterator) {
    return addProxy(this, MapValues, iterator);
  };

  /**
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
  Aigle.prototype.mapValuesSeries = function mapValuesSeries (iterator) {
    return addProxy(this, MapValuesSeries, iterator);
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
  Aigle.prototype.mapValuesLimit = function mapValuesLimit (limit, iterator) {
    return addProxy(this, MapValuesLimit, limit, iterator);
  };

  /**
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
  Aigle.prototype.filter = function filter (iterator) {
    return addProxy(this, Filter, iterator);
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
  Aigle.prototype.filterSeries = function filterSeries (iterator) {
    return addProxy(this, FilterSeries, iterator);
  };

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
  Aigle.prototype.filterLimit = function filterLimit (limit, iterator) {
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
  Aigle.prototype.reject = function reject (iterator) {
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
  Aigle.prototype.rejectSeries = function rejectSeries (iterator) {
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
  Aigle.prototype.rejectLimit = function rejectLimit (limit, iterator) {
    return addProxy(this, RejectLimit, limit, iterator);
  };

  /**
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
   *   .find(['name', 'fread])
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
  Aigle.prototype.find = function find (iterator) {
    return addProxy(this, Find, iterator);
  };

  /**
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
  Aigle.prototype.findSeries = function findSeries (iterator) {
    return addProxy(this, FindSeries, iterator);
  };

  /**
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
  Aigle.prototype.findLimit = function findLimit (limit, iterator) {
    return addProxy(this, FindLimit, limit, iterator);
  };

  /**
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
   *   .pick(iterator)
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
   *   .pick(iterator)
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
   *   .pick('active')
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
   *   .pick(['name', 'fread'])
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
   *   .pick({ name: 'fread', active: true })
   *   .then(object => {
   *     console.log(object); // { '1': { name: 'fread', active: true } }
   *   });
   */
  Aigle.prototype.pick = function pick (iterator) {
    return addProxy(this, Pick, iterator);
  };

  /**
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
   *   .pickSeries(iterator)
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
   *   .pickSeries(iterator)
   *   .then(object => {
   *     console.log(object); // { a: 1 }
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  Aigle.prototype.pickSeries = function pickSeries (iterator) {
    return addProxy(this, PickSeries, iterator);
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
   *   .pickLimit(2, iterator)
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
   *   .pickLimit(2, iterator)
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
   *   .pickLimit(iterator)
   *   .then(object => {
   *     console.log(object); // { '0': 1, '1': 5, '2': 3 }
   *     console.log(order); // [1, 2, 3, 4, 5]
   *   });
   */
  Aigle.prototype.pickLimit = function pickLimit (limit, iterator) {
    return addProxy(this, PickLimit, limit, iterator);
  };

  /**
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
   *   .omit(iterator)
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
   *   .omit(iterator)
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
   *   .omit('active')
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
   *   .omit(['name', 'fread'])
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
   *   .omit({ name: 'fread', active: true })
   *   .then(object => {
   *     console.log(object); // { '0': { name: 'bargey', active: false } }
   *   });
   */
  Aigle.prototype.omit = function omit (iterator) {
    return addProxy(this, Omit, iterator);
  };

  /**
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
   *   .omitSeries(iterator)
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
   *   .omitSeries(iterator)
   *   .then(object => {
   *     console.log(object); // { b: 4, c: 2 }
   *     console.log(order); // [1, 4, 2]
   *   });
   */
  Aigle.prototype.omitSeries = function omitSeries (iterator) {
    return addProxy(this, OmitSeries, iterator);
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
   *   .omitLimit(2, iterator)
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
   *   .omitLimit(2, iterator)
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
   *   .omitLimit(iterator)
   *   .then(object => {
   *     console.log(object); // { '3': 4, '4': 2 }
   *     console.log(order); // [1, 2, 3, 4, 5]
   *   });
   */
  Aigle.prototype.omitLimit = function omitLimit (limit, iterator) {
    return addProxy(this, OmitLimit, limit, iterator);
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
  Aigle.prototype.reduce = function reduce (iterator, result) {
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
  Aigle.prototype.transform = function transform (iterator, accumulator) {
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
  Aigle.prototype.transformSeries = function transformSeries (iterator, accumulator) {
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
  Aigle.prototype.transformLimit = function transformLimit (limit, iterator, accumulator) {
    return addProxy(this, TransformLimit, limit, iterator, accumulator);
  };

  /**
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
  Aigle.prototype.sortBy = function sortBy (iterator) {
    return addProxy(this, SortBy, iterator);
  };

  /**
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
  Aigle.prototype.sortBySeries = function sortBySeries (iterator) {
    return addProxy(this, SortBySeries, iterator);
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
  Aigle.prototype.sortByLimit = function sortByLimit (limit, iterator) {
    return addProxy(this, SortByLimit, limit, iterator);
  };

  /**
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
  Aigle.prototype.some = function some (iterator) {
    return addProxy(this, Some, iterator);
  };

  /**
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
  Aigle.prototype.someSeries = function someSeries (iterator) {
    return addProxy(this, SomeSeries, iterator);
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
  Aigle.prototype.someLimit = function someLimit (limit, iterator) {
    return addProxy(this, SomeLimit, limit, iterator);
  };

  /**
   * @param {Function|Array|Object|string} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
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
   * const iterator = num => {
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
  Aigle.prototype.every = function every (iterator) {
    return addProxy(this, Every, iterator);
  };

  /**
   * @param {Function} iterator
   * @return {Aigle} Returns an Aigle instance
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = num => {
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
   * const iterator = num => {
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
  Aigle.prototype.everySeries = function everySeries (iterator) {
    return addProxy(this, EverySeries, iterator);
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
   * const iterator = (num, key) => {
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
  Aigle.prototype.everyLimit = function everyLimit (limit, iterator) {
    return addProxy(this, EveryLimit, limit, iterator);
  };

  /**
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
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
   * const iterator = (num, key) => {
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
  Aigle.prototype.concat = function concat (iterator) {
    return addProxy(this, Concat, iterator);
  };

  /**
   * @param {Function} iterator
   * @example
   * const order = [];
   * const collection = [1, 4, 2];
   * const iterator = (num, index) => {
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
   * const iterator = (num, key) => {
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
  Aigle.prototype.concatSeries = function concatSeries (iterator) {
    return addProxy(this, ConcatSeries, iterator);
  };

  /**
   * @param {integer} [limit=8]
   * @param {Function} iterator
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
   * const iterator = (num, key) => {
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
  Aigle.prototype.concatLimit = function concatLimit (limit, iterator) {
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
  Aigle.prototype.groupBy = function groupBy (iterator) {
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
  Aigle.prototype.groupBySeries = function groupBySeries (iterator) {
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
  Aigle.prototype.groupByLimit = function groupByLimit (limit, iterator) {
    return addProxy(this, GroupByLimit, limit, iterator);
  };

  /**
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
  Aigle.prototype.delay = function delay (ms) {
    return addReceiver(this, new Delay(ms));
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
  Aigle.prototype.timeout = function timeout (ms, message) {
    return addReceiver(this, new Timeout(ms, message));
  };

  /**
   * @param {Function} tester
   * @param {Function} iterator
   */
  Aigle.prototype.whilst = function whilst$1 (tester, iterator) {
    return this.then(function (value) { return whilst(value, tester, iterator); });
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
  Aigle.prototype.doWhilst = function doWhilst$1 (iterator, tester) {
    return this.then(function (value) { return doWhilst(value, iterator, tester); });
  };

  /**
   * @param {Function} tester
   * @param {Function} iterator
   */
  Aigle.prototype.until = function until$1 (tester, iterator) {
    return this.then(function (value) { return until(value, tester, iterator); });
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
  Aigle.prototype.doUntil = function doUntil$1 (iterator, tester) {
    return this.then(function (value) { return doUntil(value, iterator, tester); });
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
  Aigle.prototype.times = function times$1 (iterator) {
    return this.then(function (value) { return times(value, iterator); });
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
  Aigle.prototype.timesSeries = function timesSeries$1 (iterator) {
    return this.then(function (value) { return timesSeries(value, iterator); });
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
  Aigle.prototype.timesLimit = function timesLimit$1 (limit, iterator) {
    return this.then(function (value) { return timesLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} handler
   */
  Aigle.prototype.disposer = function disposer (handler) {
    return new Disposer(this, handler);
  };

  /* internal functions */

  Aigle.prototype._resolve = function _resolve (value) {
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

  Aigle.prototype._callResolve = function _callResolve () {
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
    while (_receivers.length !== 0) {
      var ref$2 = _receivers.shift();
      var receiver = ref$2.receiver;
      var onFulfilled = ref$2.onFulfilled;
      if (receiver instanceof AigleProxy) {
        receiver._callResolve(_value, _key);
      } else {
        callResolve(receiver, onFulfilled, _value);
      }
    }
  };

  Aigle.prototype._reject = function _reject (reason, unhandled) {
    var this$1 = this;

    if (this._resolved !== 0) {
      return;
    }
    if (unhandled === undefined && this._receiver === undefined) {
      setImmediate(function () { return this$1._reject(reason, true); });
      return;
    }
    this._resolved = 2;
    this._value = reason;
    stackTraces && reconstructStack(this);
    this._callReject();
  };

  Aigle.prototype._callReject = function _callReject () {
    if (this._receiver === undefined) {
      process.emit('unhandledRejection', this._value);
      return;
    }
    var ref = this;
    var _receiver = ref._receiver;
    var _key = ref._key;
    this._receiver = undefined;
    if (_receiver instanceof AigleProxy) {
      _receiver._callReject(this._value);
    } else if (_key === INTERNAL) {
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
    while (_receivers.length !== 0) {
      var ref$2 = _receivers.shift();
      var receiver = ref$2.receiver;
      var onRejected = ref$2.onRejected;
      if (receiver instanceof AigleProxy) {
        receiver._callReject(_value);
      } else {
        callReject(receiver, onRejected, _value);
      }
    }
  };

  Aigle.prototype._addReceiver = function _addReceiver (receiver, key) {
    this._key = key;
    this._receiver = receiver;
  };

  return Aigle;
}(AigleCore));

module.exports = { Aigle: Aigle };

/* functions, classes */
var ref$2 = require('./all');
var all = ref$2.all;
var AigleAll = ref$2.AigleAll;
var attempt = require('./attempt');
var race = require('./race');
var ref$3 = require('./props');
var props = ref$3.props;
var ref$4 = require('./parallel');
var parallel = ref$4.parallel;
var AigleParallel = ref$4.AigleParallel;
var ref$5 = require('./each');
var each = ref$5.each;
var Each = ref$5.Each;
var ref$6 = require('./eachSeries');
var eachSeries = ref$6.eachSeries;
var EachSeries = ref$6.EachSeries;
var ref$7 = require('./eachLimit');
var eachLimit = ref$7.eachLimit;
var EachLimit = ref$7.EachLimit;
var ref$8 = require('./map');
var map = ref$8.map;
var Map = ref$8.Map;
var ref$9 = require('./mapSeries');
var mapSeries = ref$9.mapSeries;
var MapSeries = ref$9.MapSeries;
var ref$10 = require('./mapLimit');
var mapLimit = ref$10.mapLimit;
var MapLimit = ref$10.MapLimit;
var ref$11 = require('./mapValues');
var mapValues = ref$11.mapValues;
var MapValues = ref$11.MapValues;
var ref$12 = require('./mapValuesSeries');
var mapValuesSeries = ref$12.mapValuesSeries;
var MapValuesSeries = ref$12.MapValuesSeries;
var ref$13 = require('./mapValuesLimit');
var mapValuesLimit = ref$13.mapValuesLimit;
var MapValuesLimit = ref$13.MapValuesLimit;
var ref$14 = require('./filter');
var filter = ref$14.filter;
var Filter = ref$14.Filter;
var ref$15 = require('./filterSeries');
var filterSeries = ref$15.filterSeries;
var FilterSeries = ref$15.FilterSeries;
var ref$16 = require('./filterLimit');
var filterLimit = ref$16.filterLimit;
var FilterLimit = ref$16.FilterLimit;
var ref$17 = require('./reject');
var reject = ref$17.reject;
var Reject = ref$17.Reject;
var ref$18 = require('./rejectSeries');
var rejectSeries = ref$18.rejectSeries;
var RejectSeries = ref$18.RejectSeries;
var ref$19 = require('./rejectLimit');
var rejectLimit = ref$19.rejectLimit;
var RejectLimit = ref$19.RejectLimit;
var ref$20 = require('./find');
var find = ref$20.find;
var Find = ref$20.Find;
var ref$21 = require('./findSeries');
var findSeries = ref$21.findSeries;
var FindSeries = ref$21.FindSeries;
var ref$22 = require('./findLimit');
var findLimit = ref$22.findLimit;
var FindLimit = ref$22.FindLimit;
var ref$23 = require('./pick');
var pick = ref$23.pick;
var Pick = ref$23.Pick;
var ref$24 = require('./pickSeries');
var pickSeries = ref$24.pickSeries;
var PickSeries = ref$24.PickSeries;
var ref$25 = require('./pickLimit');
var pickLimit = ref$25.pickLimit;
var PickLimit = ref$25.PickLimit;
var ref$26 = require('./omit');
var omit = ref$26.omit;
var Omit = ref$26.Omit;
var ref$27 = require('./omitSeries');
var omitSeries = ref$27.omitSeries;
var OmitSeries = ref$27.OmitSeries;
var ref$28 = require('./omitLimit');
var omitLimit = ref$28.omitLimit;
var OmitLimit = ref$28.OmitLimit;
var ref$29 = require('./reduce');
var reduce = ref$29.reduce;
var Reduce = ref$29.Reduce;
var ref$30 = require('./transform');
var transform = ref$30.transform;
var Transform = ref$30.Transform;
var ref$31 = require('./transformSeries');
var transformSeries = ref$31.transformSeries;
var TransformSeries = ref$31.TransformSeries;
var ref$32 = require('./transformLimit');
var transformLimit = ref$32.transformLimit;
var TransformLimit = ref$32.TransformLimit;
var ref$33 = require('./sortBy');
var sortBy = ref$33.sortBy;
var SortBy = ref$33.SortBy;
var ref$34 = require('./sortBySeries');
var sortBySeries = ref$34.sortBySeries;
var SortBySeries = ref$34.SortBySeries;
var ref$35 = require('./sortByLimit');
var sortByLimit = ref$35.sortByLimit;
var SortByLimit = ref$35.SortByLimit;
var ref$36 = require('./some');
var some = ref$36.some;
var Some = ref$36.Some;
var ref$37 = require('./someSeries');
var someSeries = ref$37.someSeries;
var SomeSeries = ref$37.SomeSeries;
var ref$38 = require('./someLimit');
var someLimit = ref$38.someLimit;
var SomeLimit = ref$38.SomeLimit;
var ref$39 = require('./every');
var every = ref$39.every;
var Every = ref$39.Every;
var ref$40 = require('./everySeries');
var everySeries = ref$40.everySeries;
var EverySeries = ref$40.EverySeries;
var ref$41 = require('./everyLimit');
var everyLimit = ref$41.everyLimit;
var EveryLimit = ref$41.EveryLimit;
var ref$42 = require('./concat');
var concat = ref$42.concat;
var Concat = ref$42.Concat;
var ref$43 = require('./concatSeries');
var concatSeries = ref$43.concatSeries;
var ConcatSeries = ref$43.ConcatSeries;
var ref$44 = require('./concatLimit');
var concatLimit = ref$44.concatLimit;
var ConcatLimit = ref$44.ConcatLimit;
var ref$45 = require('./groupBy');
var groupBy = ref$45.groupBy;
var GroupBy = ref$45.GroupBy;
var ref$46 = require('./groupBySeries');
var groupBySeries = ref$46.groupBySeries;
var GroupBySeries = ref$46.GroupBySeries;
var ref$47 = require('./groupByLimit');
var groupByLimit = ref$47.groupByLimit;
var GroupByLimit = ref$47.GroupByLimit;
var ref$48 = require('./join');
var join = ref$48.join;
var Spread = ref$48.Spread;
var ref$49 = require('./delay');
var delay = ref$49.delay;
var Delay = ref$49.Delay;
var Timeout = require('./timeout');
var ref$50 = require('./whilst');
var whilst = ref$50.whilst;
var ref$51 = require('./doWhilst');
var doWhilst = ref$51.doWhilst;
var ref$52 = require('./until');
var until = ref$52.until;
var doUntil = require('./doUntil');
var retry = require('./retry');
var times = require('./times');
var timesSeries = require('./timesSeries');
var timesLimit = require('./timesLimit');
var ref$53 = require('./using');
var using = ref$53.using;
var Disposer = ref$53.Disposer;
var ref$54 = require('./debug');
var resolveStack = ref$54.resolveStack;
var reconstructStack = ref$54.reconstructStack;

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
Aigle.detect = find;
Aigle.detectSeries = findSeries;
Aigle.detectLimit = findLimit;
Aigle.pick = pick;
Aigle.pickSeries = pickSeries;
Aigle.pickLimit = pickLimit;
Aigle.omit = omit;
Aigle.omitSeries = omitSeries;
Aigle.omitLimit = omitLimit;
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
Aigle.promisify = require('./promisify');
Aigle.promisifyAll = require('./promisifyAll');
Aigle.delay = delay;
Aigle.whilst = whilst;
Aigle.doWhilst = doWhilst;
Aigle.until = until;
Aigle.doUntil = doUntil;
Aigle.retry = retry;
Aigle.times = times;
Aigle.timesSeries = timesSeries;
Aigle.timesLimit = timesLimit;
Aigle.using = using;

/* debug */
Aigle.config = config;
Aigle.longStackTraces = longStackTraces;

/* errors */
var ref$55 = require('./error');
var TimeoutError = ref$55.TimeoutError;
Aigle.TimeoutError = TimeoutError;

function _resolve(value) {
  var promise = new Aigle(INTERNAL);
  promise._resolved = 1;
  promise._value = value;
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

module.exports = Aigle;

function execute(promise, executor) {
  stackTraces && resolveStack(promise);
  try {
    executor(resolve, reject);
  } catch(e) {
    reject(e);
  }

  function resolve(value) {
    if (executor === undefined) {
      return;
    }
    executor = undefined;
    promise._resolve(value);
  }

  function reject(reason) {
    if (executor === undefined) {
      return;
    }
    executor = undefined;
    promise._reject(reason);
  }
}

function createOnRejected(errorTypes, onRejected) {
  return function (reason) {
    var l = errorTypes.length;
    while (l--) {
      if (reason instanceof errorTypes[l]) {
        return onRejected(reason);
      }
    }
    errorObj.e = reason;
    return errorObj;
  };
}

function createFinallyHandler(promise, handler) {
  return function () {
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
      p.then(function () { return receiver._resolve(_value); }, function (reason) { return receiver._reject(reason); });
    } else {
      p.then(function () { return receiver._reject(_value); }, function (reason) { return receiver._reject(reason); });
    }
    return receiver;
  };
}

function addAigle(promise, receiver, onFulfilled, onRejected) {
  stackTraces && resolveStack(receiver, promise);
  if (promise._receiver === undefined) {
    promise._resolved !== 0 && invokeAsync(promise);
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
 */
function config(opts) {
  stackTraces = !!opts.longStackTraces;
}

function longStackTraces() {
  stackTraces = true;
}

}).call(this,require('_process'))
},{"./all":3,"./attempt":4,"./concat":5,"./concatLimit":6,"./concatSeries":7,"./debug":8,"./delay":9,"./doUntil":10,"./doWhilst":11,"./each":12,"./eachLimit":13,"./eachSeries":14,"./error":15,"./every":16,"./everyLimit":17,"./everySeries":18,"./filter":19,"./filterLimit":20,"./filterSeries":21,"./find":22,"./findLimit":23,"./findSeries":24,"./groupBy":25,"./groupByLimit":26,"./groupBySeries":27,"./internal/async":28,"./internal/queue":30,"./internal/util":31,"./join":32,"./map":33,"./mapLimit":34,"./mapSeries":35,"./mapValues":36,"./mapValuesLimit":37,"./mapValuesSeries":38,"./omit":39,"./omitLimit":40,"./omitSeries":41,"./parallel":42,"./pick":43,"./pickLimit":44,"./pickSeries":45,"./promisify":46,"./promisifyAll":47,"./props":48,"./race":49,"./reduce":50,"./reject":51,"./rejectLimit":52,"./rejectSeries":53,"./retry":54,"./some":55,"./someLimit":56,"./someSeries":57,"./sortBy":58,"./sortByLimit":59,"./sortBySeries":60,"./timeout":61,"./times":62,"./timesLimit":63,"./timesSeries":64,"./transform":65,"./transformLimit":66,"./transformSeries":67,"./until":68,"./using":69,"./whilst":70,"_process":72,"aigle-core":71}],3:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;

var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var promiseArrayEach = ref$2.promiseArrayEach;

var AigleAll = (function (AigleProxy) {
  function AigleAll(array) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    if (array === PENDING) {
      this._rest = undefined;
      this._coll = undefined;
      this._result = undefined;
      this._execute = this._callResolve;
      this._callResolve = set;
    } else {
      var size = array.length;
      this._rest = size;
      this._coll = array;
      this._result = Array(size);
      this._execute = execute;
    }
  }

  if ( AigleProxy ) AigleAll.__proto__ = AigleProxy;
  AigleAll.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleAll.prototype.constructor = AigleAll;

  AigleAll.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  AigleAll.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleAll;
}(AigleProxy));

module.exports = { all: all, AigleAll: AigleAll };

function set(array) {
  var size = array.length;
  this._rest = size;
  this._coll = array;
  this._result = Array(size);
  this._callResolve = this._execute;
  execute.call(this);
  return this;
}

function execute() {
  if (this._rest === 0) {
    this._promise._resolve(this._result);
  } else {
    promiseArrayEach(this);
  }
  return this._promise;
}

/**
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
  return new AigleAll(array)._execute();
}


},{"./aigle":2,"./internal/util":31,"aigle-core":71}],4:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/util');
var INTERNAL = ref$1.INTERNAL;
var callResolve = ref$1.callResolve;

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

},{"./aigle":2,"./internal/util":31}],5:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;

var Concat = (function (Each) {
  function Concat(collection, iterator) {
    Each.call(this, collection, iterator);
    this._result = [];
  }

  if ( Each ) Concat.__proto__ = Each;
  Concat.prototype = Object.create( Each && Each.prototype );
  Concat.prototype.constructor = Concat;

  Concat.prototype._callResolve = function _callResolve (value) {
    if (Array.isArray(value)) {
      (ref = this._result).push.apply(ref, value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
    var ref;
  };

  return Concat;
}(Each));

module.exports = { concat: concat, Concat: Concat };

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
 * const iterator = (num, key) => {
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

},{"./each":12}],6:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;

var ConcatLimit = (function (EachLimit) {
  function ConcatLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    this._result = [];
  }

  if ( EachLimit ) ConcatLimit.__proto__ = EachLimit;
  ConcatLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  ConcatLimit.prototype.constructor = ConcatLimit;

  ConcatLimit.prototype._callResolve = function _callResolve (value) {
    if (Array.isArray(value)) {
      (ref = this._result).push.apply(ref, value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
    var ref;
  };

  return ConcatLimit;
}(EachLimit));

module.exports = { concatLimit: concatLimit, ConcatLimit: ConcatLimit };


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
 * const iterator = (num, key) => {
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

},{"./eachLimit":13}],7:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;

var ConcatSeries = (function (EachSeries) {
  function ConcatSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    this._result = [];
  }

  if ( EachSeries ) ConcatSeries.__proto__ = EachSeries;
  ConcatSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  ConcatSeries.prototype.constructor = ConcatSeries;

  ConcatSeries.prototype._callResolve = function _callResolve (value) {
    if (Array.isArray(value)) {
      (ref = this._result).push.apply(ref, value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
    var ref;
  };

  return ConcatSeries;
}(EachSeries));

module.exports = { concatSeries: concatSeries, ConcatSeries: ConcatSeries };

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
 * const iterator = (num, key) => {
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

},{"./eachSeries":14}],8:[function(require,module,exports){
'use strict';

module.exports = {
  resolveStack: resolveStack,
  reconstructStack: reconstructStack
};

function resolveStack(promise, parent) {
  var ref = new Error();
  var stack = ref.stack;
  promise._stacks = promise._stacks || [];
  if (parent && parent._stacks) {
    (ref$1 = promise._stacks).push.apply(ref$1, parent._stacks);
  }
  var stacks = stack.split('\n').slice(4);
  promise._stacks.push(stacks.join('\n'));
  var ref$1;
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

},{}],9:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;

var Delay = (function (AigleProxy) {
  function Delay(ms) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._ms = ms;
  }

  if ( AigleProxy ) Delay.__proto__ = AigleProxy;
  Delay.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Delay.prototype.constructor = Delay;

  Delay.prototype._callResolve = function _callResolve (value) {
    var this$1 = this;

    setTimeout(function () { return this$1._promise._resolve(value); }, this._ms);
  };

  Delay.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return Delay;
}(AigleProxy));

module.exports = { delay: delay, Delay: Delay };

/**
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
  var delay = new Delay(ms);
  delay._callResolve(value);
  return delay._promise;
}

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],10:[function(require,module,exports){
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

},{"./doWhilst":11,"./until":68}],11:[function(require,module,exports){
'use strict';

var ref = require('./whilst');
var AigleWhilst = ref.AigleWhilst;
var WhilstTester = ref.WhilstTester;

var DoWhilst = (function (AigleWhilst) {
  function DoWhilst(test, iterator) {
    AigleWhilst.call(this, test, iterator);
  }

  if ( AigleWhilst ) DoWhilst.__proto__ = AigleWhilst;
  DoWhilst.prototype = Object.create( AigleWhilst && AigleWhilst.prototype );
  DoWhilst.prototype.constructor = DoWhilst;

  DoWhilst.prototype._iterate = function _iterate (value) {
    this._next(value);
    return this._promise;
  };

  return DoWhilst;
}(AigleWhilst));

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

},{"./whilst":70}],12:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;

var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var ref$3 = require('./internal/collection');
var execute = ref$3.execute;
var setParallel = ref$3.setParallel;

var Each = (function (AigleProxy) {
  function Each(collection, iterator) {
    AigleProxy.call(this);
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

  if ( AigleProxy ) Each.__proto__ = AigleProxy;
  Each.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Each.prototype.constructor = Each;

  Each.prototype._execute = function _execute () {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
    return this._promise;
  };

  Each.prototype._callResolve = function _callResolve (value) {
    if (--this._rest === 0 || value === false) {
      this._promise._resolve();
    }
  };

  Each.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return Each;
}(AigleProxy));

module.exports = { each: each, Each: Each };

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
  return new Each(collection, iterator)._execute();
}

},{"./aigle":2,"./internal/collection":29,"./internal/util":31,"aigle-core":71}],13:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;

var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var ref$3 = require('./internal/collection');
var execute = ref$3.execute;
var setLimit = ref$3.setLimit;

var EachLimit = (function (AigleProxy) {
  function EachLimit(collection, limit, iterator) {
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
      this._set = setLimit;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      setLimit.call(this, collection);
    }
  }

  if ( AigleProxy ) EachLimit.__proto__ = AigleProxy;
  EachLimit.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  EachLimit.prototype.constructor = EachLimit;

  EachLimit.prototype._execute = function _execute () {
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

  EachLimit.prototype._callResolve = function _callResolve (value) {
    if (value === false) {
      this._callRest = 0;
      this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  };

  EachLimit.prototype._callReject = function _callReject (reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  };

  return EachLimit;
}(AigleProxy));

module.exports = { eachLimit: eachLimit, EachLimit: EachLimit };

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


},{"./aigle":2,"./internal/collection":29,"./internal/util":31,"aigle-core":71}],14:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;

var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var ref$3 = require('./internal/collection');
var execute = ref$3.execute;
var setSeries = ref$3.setSeries;

var EachSeries = (function (AigleProxy) {
  function EachSeries(collection, iterator) {
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
      this._set = setSeries;
      this._iterate = this._callResolve;
      this._callResolve = execute;
    } else {
      setSeries.call(this, collection);
    }
  }

  if ( AigleProxy ) EachSeries.__proto__ = AigleProxy;
  EachSeries.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  EachSeries.prototype.constructor = EachSeries;

  EachSeries.prototype._execute = function _execute () {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
    return this._promise;
  };

  EachSeries.prototype._callResolve = function _callResolve (value) {
    if (--this._rest === 0 || value === false) {
      this._promise._resolve();
    } else {
      this._iterate();
    }
  };

  EachSeries.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return EachSeries;
}(AigleProxy));

module.exports = { eachSeries: eachSeries, EachSeries: EachSeries };

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

},{"./aigle":2,"./internal/collection":29,"./internal/util":31,"aigle-core":71}],15:[function(require,module,exports){
'use strict';

var types = ['TimeoutError'];
var l = types.length;
while (l--) {
  exports[types[l]] = (function (Error) {
    function undefined(message) {
      Error.call(this, message);
    }

    if ( Error ) undefined.__proto__ = Error;
    undefined.prototype = Object.create( Error && Error.prototype );
    undefined.prototype.constructor = undefined;

    return undefined;
  }(Error));
}

},{}],16:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var Every = (function (Each) {
  function Every(collection, iterator) {
    Each.call(this, collection, iterator);
    this._result = true;
    if (collection === PENDING) {
      this._set = setShorthand;
    } else {
      setShorthand.call(this, collection);
    }
  }

  if ( Each ) Every.__proto__ = Each;
  Every.prototype = Object.create( Each && Each.prototype );
  Every.prototype.constructor = Every;

  Every.prototype._callResolve = function _callResolve (value) {
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    }
  };

  return Every;
}(Each));

module.exports = { every: every, Every: Every };

/**
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
 * const iterator = num => {
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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],17:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;

var EveryLimit = (function (EachLimit) {
  function EveryLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    this._result = true;
  }

  if ( EachLimit ) EveryLimit.__proto__ = EachLimit;
  EveryLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  EveryLimit.prototype.constructor = EveryLimit;

  EveryLimit.prototype._callResolve = function _callResolve (value) {
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  };

  return EveryLimit;
}(EachLimit));

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

},{"./eachLimit":13}],18:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries.js');
var EachSeries = ref.EachSeries;

var EverySeries = (function (EachSeries) {
  function EverySeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    this._result = true;
  }

  if ( EachSeries ) EverySeries.__proto__ = EachSeries;
  EverySeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  EverySeries.prototype.constructor = EverySeries;

  EverySeries.prototype._callResolve = function _callResolve (value) {
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    } else {
      this._iterate();
    }
  };

  return EverySeries;
}(EachSeries));

module.exports = { everySeries: everySeries, EverySeries: EverySeries };

/**
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
 * const iterator = num => {
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

},{"./eachSeries.js":14}],19:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/collection');
var setShorthand = ref$1.setShorthand;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var compactArray = ref$2.compactArray;

var Filter = (function (Each) {
  function Filter(collection, iterator) {
    Each.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) Filter.__proto__ = Each;
  Filter.prototype = Object.create( Each && Each.prototype );
  Filter.prototype.constructor = Filter;

  return Filter;
}(Each));

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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],20:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/collection');
var setLimit = ref$1.setLimit;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var compactArray = ref$2.compactArray;

var FilterLimit = (function (EachLimit) {
  function FilterLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) FilterLimit.__proto__ = EachLimit;
  FilterLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  FilterLimit.prototype.constructor = FilterLimit;

  return FilterLimit;
}(EachLimit));

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

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],21:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/collection');
var setSeries = ref$1.setSeries;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var compactArray = ref$2.compactArray;

var FilterSeries = (function (EachSeries) {
  function FilterSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) FilterSeries.__proto__ = EachSeries;
  FilterSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  FilterSeries.prototype.constructor = FilterSeries;

  return FilterSeries;
}(EachSeries));

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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],22:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var Find = (function (Each) {
  function Find(collection, iterator) {
    Each.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) Find.__proto__ = Each;
  Find.prototype = Object.create( Each && Each.prototype );
  Find.prototype.constructor = Find;

  return Find;
}(Each));

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
 * Aigle.find(collection, ['name', 'fread])
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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],23:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setLimit = ref$2.setLimit;

var FindLimit = (function (EachLimit) {
  function FindLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) FindLimit.__proto__ = EachLimit;
  FindLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  FindLimit.prototype.constructor = FindLimit;

  return FindLimit;
}(EachLimit));

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

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],24:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setSeries = ref$2.setSeries;

var FindSeries = (function (EachSeries) {
  function FindSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) FindSeries.__proto__ = EachSeries;
  FindSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  FindSeries.prototype.constructor = FindSeries;

  return FindSeries;
}(EachSeries));

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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],25:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var GroupBy = (function (Each) {
  function GroupBy(collection, iterator) {
    Each.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) GroupBy.__proto__ = Each;
  GroupBy.prototype = Object.create( Each && Each.prototype );
  GroupBy.prototype.constructor = GroupBy;

  return GroupBy;
}(Each));

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
  return  new GroupBy(collection, iterator)._execute();
}

},{"./each":12,"./internal/collection":29,"./internal/util":31}],26:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setLimit = ref$2.setLimit;

var GroupByLimit = (function (EachLimit) {
  function GroupByLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) GroupByLimit.__proto__ = EachLimit;
  GroupByLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  GroupByLimit.prototype.constructor = GroupByLimit;

  return GroupByLimit;
}(EachLimit));

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

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],27:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setSeries = ref$2.setSeries;

var GroupBySeries = (function (EachSeries) {
  function GroupBySeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) GroupBySeries.__proto__ = EachSeries;
  GroupBySeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  GroupBySeries.prototype.constructor = GroupBySeries;

  return GroupBySeries;
}(EachSeries));

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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],28:[function(require,module,exports){
'use strict';

var ticked = false;
var len = 0;
var queue = Array(8);

function tick() {
  var i = -1;
  while (++i < len) {
    var promise = queue[i];
    queue[i] = undefined;
    promise._resolved === 1 ? promise._callResolve() : promise._callReject();
  }
  ticked = false;
  len = 0;
}

function invoke(promise) {
  if (ticked === false) {
    setImmediate(tick);
    ticked = true;
  }
  queue[len++] = promise;
}

module.exports = invoke;

},{}],29:[function(require,module,exports){
'use strict';

var ref = require('./util');
var call2 = ref.call2;
var callProxyReciever = ref.callProxyReciever;

var ref$1 = [
  [iterateArrayParallel, iterateObjectParallel],
  [iterateArraySeries, iterateObjectSeries]
].map(createSet);
var setParallel = ref$1[0];
var setSeries = ref$1[1];

module.exports = {
  execute: execute,
  setParallel: setParallel,
  setShorthand: setShorthand,
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

function setShorthand(collection) {
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
  while (++i < _rest && callProxyReciever(call2(_iterator, _coll[i], i), this, i)) {}
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
    if (callProxyReciever(call2(_iterator, _coll[key], key), this$1, i) === false) {
      break;
    }
  }
}

function iterateArraySeries() {
  var i = this._index++;
  callProxyReciever(call2(this._iterator, this._coll[i], i), this, i);
}

function iterateObjectSeries() {
  var i = this._index++;
  var key = this._keys[i];
  callProxyReciever(call2(this._iterator, this._coll[key], key), this, i);
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

},{"./util":31}],30:[function(require,module,exports){
'use strict';

var Queue = function Queue(size) {
  if ( size === void 0 ) size = 8;

  this.array = Array(size);
  this.length = 0;
};

Queue.prototype.push = function push (task) {
  this.array[this.length++] = task;
};

Queue.prototype.shift = function shift () {
  var index = --this.length;
  var task = this.array[index];
  this.array[index] = undefined;
  return task;
};

module.exports = Queue;

},{}],31:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleCore = ref.AigleCore;
var ref$1 = require('../../package.json');
var VERSION = ref$1.version;
var DEFAULT_LIMIT = 8;
var errorObj = { e: undefined };

module.exports = {
  VERSION: VERSION,
  DEFAULT_LIMIT: DEFAULT_LIMIT,
  INTERNAL: INTERNAL,
  PENDING: PENDING,
  errorObj: errorObj,
  call0: call0,
  call1: call1,
  call2: call2,
  call3: call3,
  apply: apply,
  callResolve: callResolve,
  callReject: callReject,
  callThen: callThen,
  callProxyReciever: callProxyReciever,
  promiseArrayEach: promiseArrayEach,
  promiseObjectEach: promiseObjectEach,
  compactArray: compactArray,
  clone: clone,
  sort: sort
};

function INTERNAL() {}

function PENDING() {}

function call0(handler) {
  try {
    return handler();
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call1(handler, value) {
  try {
    return handler(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call2(handler, arg1, arg2) {
  try {
    return handler(arg1, arg2);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call3(handler, arg1, arg2, arg3) {
  try {
    return handler(arg1, arg2, arg3);
  } catch(e) {
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
  } catch(e) {
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
  if (promise instanceof AigleCore) {
    switch (promise._resolved) {
    case 0:
      promise._addReceiver(receiver, INTERNAL);
      return;
    case 1:
      receiver._resolve(promise._value);
      return;
    case 2:
      receiver._reject(promise._value);
      return;
    }
  }
  if (promise && promise.then) {
    callThen(promise, receiver);
  } else {
    receiver._resolve(promise);
  }
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
  if (promise instanceof AigleCore) {
    switch (promise._resolved) {
    case 0:
      promise._addReceiver(receiver, INTERNAL);
      return;
    case 1:
      receiver._resolve(promise._value);
      return;
    case 2:
      receiver._reject(promise._value);
      return;
    }
  }
  if (promise && promise.then) {
    callThen(promise, receiver);
  } else {
    receiver._resolve(promise);
  }
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
  var i = -1;
  while (++i < _rest) {
    var key = _keys[i];
    var promise = _coll[key];
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, key);
        continue;
      case 1:
        receiver._callResolve(promise._value, key);
        continue;
      case 2:
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

function sortIterator(a, b) {
  return a.criteria - b.criteria;
}

function sort(array) {
  array.sort(sortIterator);
  var l = array.length;
  while (l--) {
    array[l] = array[l].value;
  }
  return array;
}

},{"../../package.json":74,"aigle-core":71}],32:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var call1 = ref$2.call1;
var apply = ref$2.apply;
var callProxyReciever = ref$2.callProxyReciever;

var Join = (function (AigleProxy) {
  function Join(handler, size) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = Array(size);
    this._handler = handler;
  }

  if ( AigleProxy ) Join.__proto__ = AigleProxy;
  Join.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Join.prototype.constructor = Join;

  Join.prototype._callResolve = function _callResolve (value, index) {
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

  Join.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return Join;
}(AigleProxy));

var Spread = (function (AigleProxy) {
  function Spread(handler) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._handler = handler;
  }

  if ( AigleProxy ) Spread.__proto__ = AigleProxy;
  Spread.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Spread.prototype.constructor = Spread;

  Spread.prototype._callResolve = function _callResolve (value, index) {
    if (index === INTERNAL) {
      return this._promise._resolve(value);
    }
    spread(this, value);
  };

  Spread.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return Spread;
}(AigleProxy));

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

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],33:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var Map = (function (Each) {
  function Map(collection, iterator) {
    Each.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) Map.__proto__ = Each;
  Map.prototype = Object.create( Each && Each.prototype );
  Map.prototype.constructor = Map;

  Map.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return Map;
}(Each));

module.exports = { map: map, Map: Map };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],34:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setLimit = ref$2.setLimit;

var MapLimit = (function (EachLimit) {
  function MapLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
    }
  }

  if ( EachLimit ) MapLimit.__proto__ = EachLimit;
  MapLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  MapLimit.prototype.constructor = MapLimit;

  MapLimit.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  };

  return MapLimit;
}(EachLimit));

module.exports = { mapLimit: mapLimit, MapLimit: MapLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  return this;
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


},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],35:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setSeries = ref$2.setSeries;

var MapSeries = (function (EachSeries) {
  function MapSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
    }
  }

  if ( EachSeries ) MapSeries.__proto__ = EachSeries;
  MapSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  MapSeries.prototype.constructor = MapSeries;

  MapSeries.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  };

  return MapSeries;
}(EachSeries));

module.exports = { mapSeries: mapSeries, MapSeries: MapSeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  return this;
}

/**
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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],36:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var MapValues = (function (Each) {
  function MapValues(collection, iterator) {
    Each.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) MapValues.__proto__ = Each;
  MapValues.prototype = Object.create( Each && Each.prototype );
  MapValues.prototype.constructor = MapValues;

  return MapValues;
}(Each));

module.exports = { mapValues: mapValues, MapValues: MapValues };

function set(collection) {
  setShorthand.call(this, collection);
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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],37:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setLimit = ref$2.setLimit;

var MapValuesLimit = (function (EachLimit) {
  function MapValuesLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) MapValuesLimit.__proto__ = EachLimit;
  MapValuesLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  MapValuesLimit.prototype.constructor = MapValuesLimit;

  return MapValuesLimit;
}(EachLimit));

module.exports = { mapValuesLimit: mapValuesLimit, MapValuesLimit: MapValuesLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
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

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],38:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setSeries = ref$2.setSeries;

var MapValuesSeries = (function (EachSeries) {
  function MapValuesSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) MapValuesSeries.__proto__ = EachSeries;
  MapValuesSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  MapValuesSeries.prototype.constructor = MapValuesSeries;

  return MapValuesSeries;
}(EachSeries));

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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],39:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var Omit = (function (Each) {
  function Omit(collection, iterator) {
    Each.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) Omit.__proto__ = Each;
  Omit.prototype = Object.create( Each && Each.prototype );
  Omit.prototype.constructor = Omit;

  return Omit;
}(Each));

module.exports = { omit: omit, Omit: Omit };

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
 * Aigle.omit(collection, iterator)
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
 * Aigle.omit(collection, iterator)
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
 * Aigle.omit(collection, 'active')
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
 * Aigle.omit(collection, ['name', 'fread'])
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
 * Aigle.omit(collection, { name: 'fread', active: true })
 *   .then(object => {
 *     console.log(object); // { '0': { name: 'bargey', active: false } }
 *   });
 */
function omit(collection, iterator) {
  return new Omit(collection, iterator)._execute();
}

},{"./each":12,"./internal/collection":29,"./internal/util":31}],40:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setLimit = ref$2.setLimit;

var OmitLimit = (function (EachLimit) {
  function OmitLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) OmitLimit.__proto__ = EachLimit;
  OmitLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  OmitLimit.prototype.constructor = OmitLimit;

  return OmitLimit;
}(EachLimit));

module.exports = { omitLimit: omitLimit, OmitLimit: OmitLimit };

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
 * Aigle.omitLimit(collection, 2, iterator)
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
 * Aigle.omitLimit(collection, 2, iterator)
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
 * Aigle.omitLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '3': 4, '4': 2 }
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function omitLimit(collection, limit, iterator) {
  return new OmitLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],41:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setSeries = ref$2.setSeries;

var OmitSeries = (function (EachSeries) {
  function OmitSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) OmitSeries.__proto__ = EachSeries;
  OmitSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  OmitSeries.prototype.constructor = OmitSeries;

  return OmitSeries;
}(EachSeries));

module.exports = { omitSeries: omitSeries, OmitSeries: OmitSeries };

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
 * Aigle.OmitSeriesSeries(collection, iterator)
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
 * Aigle.OmitSeriesSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { b: 4, c: 2 }
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function omitSeries(collection, iterator) {
  return new OmitSeries(collection, iterator)._execute();
}

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],42:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;

var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var promiseArrayEach = ref$2.promiseArrayEach;
var promiseObjectEach = ref$2.promiseObjectEach;

var AigleParallel = (function (AigleProxy) {
  function AigleParallel(collection) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._rest = undefined;
    this._coll = undefined;
    this._keys = undefined;
    this._result = undefined;
    if (collection === PENDING) {
      this._result = this._callResolve;
      this._callResolve = execute;
    } else {
      set.call(this, collection);
    }
  }

  if ( AigleProxy ) AigleParallel.__proto__ = AigleProxy;
  AigleParallel.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleParallel.prototype.constructor = AigleParallel;

  AigleParallel.prototype._execute = function _execute () {
    if (this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._keys === undefined) {
      promiseArrayEach(this);
    } else {
      promiseObjectEach(this);
    }
    return this._promise;
  };

  AigleParallel.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  AigleParallel.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleParallel;
}(AigleProxy));

module.exports = { parallel: parallel, AigleParallel: AigleParallel };

function execute(collection) {
  this._callResolve = this._result;
  set.call(this, collection);
  this._execute();
}

function set(collection) {
  if (Array.isArray(collection)) {
    var size = collection.length;
    this._rest = size;
    this._coll = collection;
    this._result = Array(size);
    this._iterate = promiseArrayEach;
  } else if (collection && typeof collection === 'object') {
    var keys = Object.keys(collection);
    this._rest = keys.length;
    this._coll = collection;
    this._keys = keys;
    this._result = {};
    this._iterate = promiseObjectEach;
  } else {
    this._rest = 0;
    this._result = {};
  }
  return this;
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

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],43:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var Pick = (function (Each) {
  function Pick(collection, iterator) {
    Each.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) Pick.__proto__ = Each;
  Pick.prototype = Object.create( Each && Each.prototype );
  Pick.prototype.constructor = Pick;

  return Pick;
}(Each));

module.exports = { pick: pick, Pick: Pick };

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
 * @example
 * const order = [];
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.pick(collection, 'active')
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
 * Aigle.pick(collection, ['name', 'fread'])
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
 * Aigle.pick(collection, { name: 'fread', active: true })
 *   .then(object => {
 *     console.log(object); // { '1': { name: 'fread', active: true } }
 *   });
 */
function pick(collection, iterator) {
  return new Pick(collection, iterator)._execute();
}

},{"./each":12,"./internal/collection":29,"./internal/util":31}],44:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setLimit = ref$2.setLimit;

var PickLimit = (function (EachLimit) {
  function PickLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) PickLimit.__proto__ = EachLimit;
  PickLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  PickLimit.prototype.constructor = PickLimit;

  return PickLimit;
}(EachLimit));

module.exports = { pickLimit: pickLimit, PickLimit: PickLimit };

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
 * Aigle.pickLimit(collection, 2, iterator)
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
 * Aigle.pickLimit(collection, 2, iterator)
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
 * Aigle.pickLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': 1, '1': 5, '2': 3 }
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function pickLimit(collection, limit, iterator) {
  return new PickLimit(collection, limit, iterator)._execute();
}

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],45:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setSeries = ref$2.setSeries;

var PickSeries = (function (EachSeries) {
  function PickSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    this._result = {};
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) PickSeries.__proto__ = EachSeries;
  PickSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  PickSeries.prototype.constructor = PickSeries;

  return PickSeries;
}(EachSeries));

module.exports = { pickSeries: pickSeries, PickSeries: PickSeries };

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
 * Aigle.pickSeries(collection, iterator)
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
 * Aigle.pickSeries(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { a: 1 }
 *     console.log(order); // [1, 4, 2]
 *   });
 */
function pickSeries(collection, iterator) {
  return new PickSeries(collection, iterator)._execute();
}

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],46:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/util');
var INTERNAL = ref$1.INTERNAL;

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
  return function (err, res) {
    if (err) {
      promise._reject(err);
    } else {
      promise._resolve(res);
    }
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

  promisified.__isPromisified__ = true;
  return promisified;

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

},{"./aigle":2,"./internal/util":31}],47:[function(require,module,exports){
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
 * @param {Function} [opts.depth=2]
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
  var suffix = ref.suffix; if ( suffix === void 0 ) suffix = 'Async';
  var filter = ref.filter; if ( filter === void 0 ) filter = defaultFilter;
  var depth = ref.depth; if ( depth === void 0 ) depth = 2;
  _promisifyAll(suffix, filter, target, undefined, undefined, depth);
  return target;
}

function defaultFilter(name) {
  return /^_/.test(name);
}

function _promisifyAll(suffix, filter, obj, key, target, depth) {
  var memo = {};
  switch (typeof obj) {
  case 'function':
    if (target) {
      var _key = "" + key + suffix;
      if (target[_key]) {
        if (!target[_key].__isPromisified__) {
          throw new TypeError(("Cannot promisify an API that has normal methods with '" + suffix + "'-suffix"));
        }
      } else {
        target[_key] = promisify(obj);
      }
    }
    iterate(suffix, filter, obj, obj, depth, memo);
    iterate(suffix, filter, obj.prototype, obj.prototype, depth, memo);
    break;
  case 'object':
    iterate(suffix, filter, obj, obj, depth, memo);
    iterate(suffix, filter, Object.getPrototypeOf(obj), obj, depth, memo);
    break;
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
    if (skipMap[key] === true || memo[key] === true || filter(key)) {
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

},{"./promisify":46}],48:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;

var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var promiseObjectEach = ref$2.promiseObjectEach;

var AigleProps = (function (AigleProxy) {
  function AigleProps(object) {
    AigleProxy.call(this);
    var keys = Object.keys(object);
    var size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._coll = object;
    this._result = {};
    if (size === 0) {
      this._promise._resolve(this._result);
    } else {
      promiseObjectEach(this);
    }
  }

  if ( AigleProxy ) AigleProps.__proto__ = AigleProxy;
  AigleProps.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleProps.prototype.constructor = AigleProps;

  AigleProps.prototype._callResolve = function _callResolve (value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  AigleProps.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleProps;
}(AigleProxy));

module.exports = { props: props, AigleProps: AigleProps };

/**
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
  return new AigleProps(object)._promise;
}

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],49:[function(require,module,exports){
'use strict';

var ref = require('./parallel');
var AigleParallel = ref.AigleParallel;

var AigleRace = (function (AigleParallel) {
  function AigleRace(collection) {
    AigleParallel.call(this, collection);
    this._result = undefined;
  }

  if ( AigleParallel ) AigleRace.__proto__ = AigleParallel;
  AigleRace.prototype = Object.create( AigleParallel && AigleParallel.prototype );
  AigleRace.prototype.constructor = AigleRace;

  AigleRace.prototype._callResolve = function _callResolve (value) {
    this._promise._resolve(value);
  };

  return AigleRace;
}(AigleParallel));

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
  return new AigleRace(collection)._execute();
}

},{"./parallel":42}],50:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;

var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/collection');
var execute = ref$2.execute;
var setSeries = ref$2.setSeries;
var ref$3 = require('./internal/util');
var INTERNAL = ref$3.INTERNAL;
var PENDING = ref$3.PENDING;
var call3 = ref$3.call3;
var callProxyReciever = ref$3.callProxyReciever;

var Reduce = (function (AigleProxy) {
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

  if ( AigleProxy ) Reduce.__proto__ = AigleProxy;
  Reduce.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Reduce.prototype.constructor = Reduce;

  Reduce.prototype._callResolve = function _callResolve (result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._iterate(++index, result);
    }
  };

  Reduce.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return Reduce;
}(AigleProxy));

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

},{"./aigle":2,"./internal/collection":29,"./internal/util":31,"aigle-core":71}],51:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/collection');
var setShorthand = ref$1.setShorthand;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var compactArray = ref$2.compactArray;

var Reject = (function (Each) {
  function Reject(collection, iterator) {
    Each.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) Reject.__proto__ = Each;
  Reject.prototype = Object.create( Each && Each.prototype );
  Reject.prototype.constructor = Reject;

  return Reject;
}(Each));

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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],52:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/collection');
var setLimit = ref$1.setLimit;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var compactArray = ref$2.compactArray;

var RejectLimit = (function (EachLimit) {
  function RejectLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) RejectLimit.__proto__ = EachLimit;
  RejectLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  RejectLimit.prototype.constructor = RejectLimit;

  return RejectLimit;
}(EachLimit));

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

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],53:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/collection');
var setSeries = ref$1.setSeries;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var PENDING = ref$2.PENDING;
var compactArray = ref$2.compactArray;

var RejectSeries = (function (EachSeries) {
  function RejectSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) RejectSeries.__proto__ = EachSeries;
  RejectSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  RejectSeries.prototype.constructor = RejectSeries;

  return RejectSeries;
}(EachSeries));

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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],54:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var call0 = ref$2.call0;
var callProxyReciever = ref$2.callProxyReciever;
var DEFAULT_RETRY = 5;

var Retry = (function (AigleProxy) {
  function Retry(handler, times) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._rest = times;
    this._handler = handler;
    this._iterate();
  }

  if ( AigleProxy ) Retry.__proto__ = AigleProxy;
  Retry.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Retry.prototype.constructor = Retry;

  Retry.prototype._iterate = function _iterate () {
    callProxyReciever(call0(this._handler), this, undefined);
  };

  Retry.prototype._callResolve = function _callResolve (value) {
    this._promise._resolve(value);
  };

  Retry.prototype._callReject = function _callReject (reason) {
    if (--this._rest === 0) {
      this._promise._reject(reason);
    } else {
      this._iterate();
    }
  };

  return Retry;
}(AigleProxy));

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

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],55:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var Some = (function (Each) {
  function Some(collection, iterator) {
    Each.call(this, collection, iterator);
    this._result = false;
    if (collection === PENDING) {
      this._set = setShorthand;
    } else {
      setShorthand.call(this, collection);
    }
  }

  if ( Each ) Some.__proto__ = Each;
  Some.prototype = Object.create( Each && Each.prototype );
  Some.prototype.constructor = Some;

  Some.prototype._callResolve = function _callResolve (value) {
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  };

  return Some;
}(Each));

module.exports = { some: some, Some: Some };

/**
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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],56:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;

var SomeLimit = (function (EachLimit) {
  function SomeLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    this._result = false;
  }

  if ( EachLimit ) SomeLimit.__proto__ = EachLimit;
  SomeLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  SomeLimit.prototype.constructor = SomeLimit;

  SomeLimit.prototype._callResolve = function _callResolve (value) {
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  };

  return SomeLimit;
}(EachLimit));

module.exports = { someLimit: someLimit, SomeLimit: SomeLimit };

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

},{"./eachLimit":13}],57:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries.js');
var EachSeries = ref.EachSeries;

var SomeSeries = (function (EachSeries) {
  function SomeSeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    this._result = false;
  }

  if ( EachSeries ) SomeSeries.__proto__ = EachSeries;
  SomeSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  SomeSeries.prototype.constructor = SomeSeries;

  SomeSeries.prototype._callResolve = function _callResolve (value) {
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    } else {
      this._iterate();
    }
  };

  return SomeSeries;
}(EachSeries));

module.exports = { someSeries: someSeries, SomeSeries: SomeSeries };

/**
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

},{"./eachSeries.js":14}],58:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var sort = ref$1.sort;
var ref$2 = require('./internal/collection');
var setShorthand = ref$2.setShorthand;

var SortBy = (function (Each) {
  function SortBy(collection, iterator) {
    Each.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) SortBy.__proto__ = Each;
  SortBy.prototype = Object.create( Each && Each.prototype );
  SortBy.prototype.constructor = SortBy;

  return SortBy;
}(Each));

module.exports = { sortBy: sortBy, SortBy: SortBy };

function set(collection) {
  setShorthand.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criteria, index) {
  this._result[index] = { criteria: criteria, value: this._coll[index] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
  }
}

function callResolveObject(criteria, index) {
  this._result[index] = { criteria: criteria, value: this._coll[this._keys[index]] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
  }
}

/**
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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],59:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var sort = ref$1.sort;
var ref$2 = require('./internal/collection');
var setLimit = ref$2.setLimit;

var SortByLimit = (function (EachLimit) {
  function SortByLimit(collection, limit, iterator) {
    EachLimit.call(this, collection, limit, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachLimit ) SortByLimit.__proto__ = EachLimit;
  SortByLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  SortByLimit.prototype.constructor = SortByLimit;

  return SortByLimit;
}(EachLimit));

module.exports = { sortByLimit: sortByLimit, SortByLimit: SortByLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criteria, index) {
  this._result[index] = { criteria: criteria, value: this._coll[index] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(criteria, index) {
  this._result[index] = { criteria: criteria, value: this._coll[this._keys[index]] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
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

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],60:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/util');
var PENDING = ref$1.PENDING;
var sort = ref$1.sort;
var ref$2 = require('./internal/collection');
var setSeries = ref$2.setSeries;

var SortBySeries = (function (EachSeries) {
  function SortBySeries(collection, iterator) {
    EachSeries.call(this, collection, iterator);
    if (collection === PENDING) {
      this._set = set;
    } else {
      this._result = Array(this._rest);
      this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
    }
  }

  if ( EachSeries ) SortBySeries.__proto__ = EachSeries;
  SortBySeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  SortBySeries.prototype.constructor = SortBySeries;

  return SortBySeries;
}(EachSeries));

module.exports = { sortBySeries: sortBySeries, SortBySeries: SortBySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._result = Array(this._rest);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(criteria, index) {
  this._result[index] = { criteria: criteria, value: this._coll[index] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
  } else {
    this._iterate();
  }
}

function callResolveObject(criteria, index) {
  this._result[index] = { criteria: criteria, value: this._coll[this._keys[index]] };
  if (--this._rest === 0) {
    this._promise._resolve(sort(this._result));
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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],61:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./error');
var TimeoutError = ref$2.TimeoutError;
var ref$3 = require('./internal/util');
var INTERNAL = ref$3.INTERNAL;

var Timeout = (function (AigleProxy) {
  function Timeout(ms, message) {
    var this$1 = this;

    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._message = message;
    this._timer = setTimeout(function () {
      if (message) {
        this$1._callReject(message);
      } else {
        this$1._callReject(new TimeoutError('operation timed out'));
      }
    }, ms);
  }

  if ( AigleProxy ) Timeout.__proto__ = AigleProxy;
  Timeout.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Timeout.prototype.constructor = Timeout;

  Timeout.prototype._callResolve = function _callResolve (value) {
    clearTimeout(this._timer);
    this._promise._resolve(value);
  };

  Timeout.prototype._callReject = function _callReject (reason) {
    clearTimeout(this._timer);
    this._promise._reject(reason);
  };

  return Timeout;
}(AigleProxy));

module.exports = Timeout;

},{"./aigle":2,"./error":15,"./internal/util":31,"aigle-core":71}],62:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var call1 = ref$2.call1;
var callProxyReciever = ref$2.callProxyReciever;

var Times = (function (AigleProxy) {
  function Times(times, iterator) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._rest = times;
    this._result = Array(times);
    this._iterator = iterator;
    var i = -1;
    while (++i < times && callProxyReciever(call1(this._iterator, i), this, i)) {}
  }

  if ( AigleProxy ) Times.__proto__ = AigleProxy;
  Times.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Times.prototype.constructor = Times;

  Times.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  Times.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return Times;
}(AigleProxy));

module.exports = times;

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
  times = +times;
  if (times >= 1) {
    return new Times(times, iterator)._promise;
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],63:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
var callProxyReciever = ref$2.callProxyReciever;
var call1 = ref$2.call1;

var TimesLimit = (function (AigleProxy) {
  function TimesLimit(times, iterator, limit) {
    var this$1 = this;

    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    limit = limit > times ? times : limit;
    this._index = 0;
    this._rest = times;
    this._callRest = times - limit;
    this._result = Array(times);
    this._iterator = iterator;
    while (limit--) {
      this$1._iterate();
    }
  }

  if ( AigleProxy ) TimesLimit.__proto__ = AigleProxy;
  TimesLimit.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  TimesLimit.prototype.constructor = TimesLimit;

  TimesLimit.prototype._iterate = function _iterate () {
    var i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  };

  TimesLimit.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  };

  TimesLimit.prototype._callReject = function _callReject (reason) {
    this._callRest = 0;
    this._promise._reject(reason);
  };

  return TimesLimit;
}(AigleProxy));

module.exports = timesLimit;

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
  times = +times;
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  } else {
    limit = +limit;
  }
  if (times >= 1 && limit >= 1) {
    return new TimesLimit(times, iterator, limit)._promise;
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],64:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var call1 = ref$2.call1;
var callProxyReciever = ref$2.callProxyReciever;

module.exports = timesSeries;

var TimesSeries = (function (AigleProxy) {
  function TimesSeries(times, iterator) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._index = 0;
    this._rest = times;
    this._result = Array(times);
    this._iterator = iterator;
    this._iterate();
  }

  if ( AigleProxy ) TimesSeries.__proto__ = AigleProxy;
  TimesSeries.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  TimesSeries.prototype.constructor = TimesSeries;

  TimesSeries.prototype._iterate = function _iterate () {
    var i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  };

  TimesSeries.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  };

  return TimesSeries;
}(AigleProxy));



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
  times = +times;
  if (times >= 1) {
    return new TimesSeries(times, iterator)._promise;
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],65:[function(require,module,exports){
'use strict';

var ref = require('./each');
var Each = ref.Each;
var ref$1 = require('./internal/collection');
var setParallel = ref$1.setParallel;
var ref$2 = require('./internal/util');
var PENDING = ref$2.PENDING;
var call3 = ref$2.call3;
var callProxyReciever = ref$2.callProxyReciever;
var clone = ref$2.clone;

var Transform = (function (Each) {
  function Transform(collection, iterator, accumulator) {
    Each.call(this, collection, iterator);
    if (accumulator !== undefined) {
      this._result = accumulator;
    }
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( Each ) Transform.__proto__ = Each;
  Transform.prototype = Object.create( Each && Each.prototype );
  Transform.prototype.constructor = Transform;

  Transform.prototype._callResolve = function _callResolve (bool) {
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return Transform;
}(Each));

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

},{"./each":12,"./internal/collection":29,"./internal/util":31}],66:[function(require,module,exports){
'use strict';

var ref = require('./eachLimit');
var EachLimit = ref.EachLimit;
var ref$1 = require('./internal/collection');
var setLimit = ref$1.setLimit;
var ref$2 = require('./internal/util');
var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
var PENDING = ref$2.PENDING;
var call3 = ref$2.call3;
var callProxyReciever = ref$2.callProxyReciever;
var clone = ref$2.clone;

var TransformLimit = (function (EachLimit) {
  function TransformLimit(collection, limit, iterator, accumulator) {
    if (typeof limit === 'function') {
      accumulator = iterator;
      iterator = limit;
      limit = DEFAULT_LIMIT;
    }
    EachLimit.call(this, collection, limit, iterator);
    if (accumulator !== undefined) {
      this._result = accumulator;
    }
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( EachLimit ) TransformLimit.__proto__ = EachLimit;
  TransformLimit.prototype = Object.create( EachLimit && EachLimit.prototype );
  TransformLimit.prototype.constructor = TransformLimit;

  TransformLimit.prototype._callResolve = function _callResolve (bool) {
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  };

  return TransformLimit;
}(EachLimit));

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

},{"./eachLimit":13,"./internal/collection":29,"./internal/util":31}],67:[function(require,module,exports){
'use strict';

var ref = require('./eachSeries');
var EachSeries = ref.EachSeries;
var ref$1 = require('./internal/collection');
var setSeries = ref$1.setSeries;
var ref$2 = require('./internal/util');
var PENDING = ref$2.PENDING;
var call3 = ref$2.call3;
var callProxyReciever = ref$2.callProxyReciever;
var clone = ref$2.clone;

var TransformSeries = (function (EachSeries) {
  function TransformSeries(collection, iterator, accumulator) {
    EachSeries.call(this, collection, iterator);
    if (accumulator !== undefined) {
      this._result = accumulator;
    }
    if (collection === PENDING) {
      this._set = set;
    } else {
      set.call(this, collection);
    }
  }

  if ( EachSeries ) TransformSeries.__proto__ = EachSeries;
  TransformSeries.prototype = Object.create( EachSeries && EachSeries.prototype );
  TransformSeries.prototype.constructor = TransformSeries;

  TransformSeries.prototype._callResolve = function _callResolve (bool) {
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  };

  return TransformSeries;
}(EachSeries));

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

},{"./eachSeries":14,"./internal/collection":29,"./internal/util":31}],68:[function(require,module,exports){
'use strict';

var ref = require('./whilst');
var AigleWhilst = ref.AigleWhilst;
var WhilstTester = ref.WhilstTester;

var UntilTester = (function (WhilstTester) {
  function UntilTester(tester) {
    WhilstTester.call(this, tester);
  }

  if ( WhilstTester ) UntilTester.__proto__ = WhilstTester;
  UntilTester.prototype = Object.create( WhilstTester && WhilstTester.prototype );
  UntilTester.prototype.constructor = UntilTester;

  UntilTester.prototype._callResolve = function _callResolve (value) {
    if (value) {
      this._proxy._promise._resolve(this._value);
    } else {
      this._proxy._next(this._value);
    }
  };

  return UntilTester;
}(WhilstTester));

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

},{"./whilst":70}],69:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var apply = ref$2.apply;
var call1 = ref$2.call1;
var callProxyReciever = ref$2.callProxyReciever;

var DISPOSER = {};

var Disposer = function Disposer(promise, handler) {
  this._promise = promise;
  this._handler = handler;
};

Disposer.prototype._dispose = function _dispose () {
    var this$1 = this;

  var ref = this;
    var _promise = ref._promise;
  switch (_promise._resolved) {
  case 0:
    return _promise.then(function () { return this$1._dispose(); });
  case 1:
    return call1(this._handler, this._promise._value);
  }
};

var Using = (function (AigleProxy) {
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

  if ( AigleProxy ) Using.__proto__ = AigleProxy;
  Using.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Using.prototype.constructor = Using;

  Using.prototype._spread = function _spread () {
    var ref = this;
    var _handler = ref._handler;
    var _result = ref._result;
    if (typeof _handler !== 'function') {
      return this._callResolve(undefined, INTERNAL);
    }
    callProxyReciever(apply(_handler, _result), this, INTERNAL);
  };

  Using.prototype._release = function _release () {
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

  Using.prototype._callResolve = function _callResolve (value, index) {
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

  Using.prototype._callReject = function _callReject (reason) {
    if (this._error) {
      return this._promise._reject(reason);
    }
    this._error = reason;
    this._release();
  };

  return Using;
}(AigleProxy));

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

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],70:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var callProxyReciever = ref$2.callProxyReciever;
var call1 = ref$2.call1;

var WhilstTester = (function (AigleProxy) {
  function WhilstTester(tester) {
    AigleProxy.call(this);
    this._tester = tester;
    this._proxy = undefined;
    this._value = undefined;
  }

  if ( AigleProxy ) WhilstTester.__proto__ = AigleProxy;
  WhilstTester.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  WhilstTester.prototype.constructor = WhilstTester;

  WhilstTester.prototype._test = function _test (value) {
    this._value = value;
    callProxyReciever(call1(this._tester, value), this, undefined);
  };

  WhilstTester.prototype._callResolve = function _callResolve (value) {
    if (value) {
      this._proxy._next(this._value);
    } else {
      this._proxy._promise._resolve(this._value);
    }
  };

  WhilstTester.prototype._callReject = function _callReject (reason) {
    this._proxy._callReject(reason);
  };

  return WhilstTester;
}(AigleProxy));

var AigleWhilst = (function (AigleProxy) {
  function AigleWhilst(tester, iterator) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    this._tester = tester;
    this._iterator = iterator;
    tester._proxy = this;
  }

  if ( AigleProxy ) AigleWhilst.__proto__ = AigleProxy;
  AigleWhilst.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleWhilst.prototype.constructor = AigleWhilst;

  AigleWhilst.prototype._iterate = function _iterate (value) {
    this._callResolve(value);
    return this._promise;
  };

  AigleWhilst.prototype._next = function _next (value) {
    callProxyReciever(call1(this._iterator, value), this, undefined);
  };

  AigleWhilst.prototype._callResolve = function _callResolve (value) {
    this._tester._test(value);
  };

  AigleWhilst.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleWhilst;
}(AigleProxy));

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

},{"./aigle":2,"./internal/util":31,"aigle-core":71}],71:[function(require,module,exports){
'use strict';

var AigleCore = function AigleCore() {};

var AigleProxy = function AigleProxy() {};

module.exports = { AigleCore: AigleCore, AigleProxy: AigleProxy };

},{}],72:[function(require,module,exports){
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

},{}],73:[function(require,module,exports){
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
      var arguments$1 = arguments;

      // Callback can either be a function or a string
      if (typeof callback !== "function") {
        callback = new Function("" + callback);
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
},{"_process":72}],74:[function(require,module,exports){
module.exports={
  "name": "aigle",
  "version": "1.3.2",
  "description": "Aigle is an ideal Promise library, faster and more functional than other Promise libraries",
  "main": "index.js",
  "browser": "browser.js",
  "scripts": {
    "test": "DELAY=50 istanbul cover ./node_modules/.bin/_mocha --report lcovonly -- -R spec ./test --recursive && codecov"
  },
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
    "babili": "0.0.12",
    "benchmark": "^2.1.1",
    "bluebird": "^3.5.0",
    "browserify": "^14.1.0",
    "buble": "^0.15.2",
    "codecov": "^2.1.0",
    "docdash": "^0.4.0",
    "gulp": "^3.9.1",
    "gulp-bump": "^2.7.0",
    "gulp-git": "^2.0.0",
    "gulp-tag-version": "^1.3.0",
    "istanbul": "^0.4.5",
    "jsdoc": "^3.4.3",
    "lodash": "^4.15.0",
    "minimist": "^1.2.0",
    "mocha": "^3.2.0",
    "mocha.parallel": "^0.15.0",
    "neo-async": "^2.0.1",
    "require-dir": "^0.3.1",
    "run-sequence": "^1.2.2",
    "setimmediate": "^1.0.5",
    "uglify-js": "^3.0.0"
  },
  "dependencies": {
    "aigle-core": "^1.0.0"
  }
}

},{}]},{},[1])(1)
});
