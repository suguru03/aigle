(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Promise = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a){ return a(o,!0); }if(i){ return i(o,!0); }var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++){ s(r[o]); }return s})({1:[function(require,module,exports){
'use strict';

require('setimmediate');
module.exports = require('./lib/aigle');

},{"./lib/aigle":2,"setimmediate":72}],2:[function(require,module,exports){
(function (process){
'use strict';

var ref = require('aigle-core');
var AigleCore = ref.AigleCore;
var AigleProxy = ref.AigleProxy;
var Queue = require('./internal/queue');
var Task = require('./internal/task');
var ref$1 = require('./internal/util');
var VERSION = ref$1.VERSION;
var INTERNAL = ref$1.INTERNAL;
var errorObj = ref$1.errorObj;
var call0 = ref$1.call0;
var call1 = ref$1.call1;
var callThen = ref$1.callThen;
var queue = new Queue();

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

  Aigle.prototype.toString = function toString () {
    return '[object Promise]';
  };

  /**
   * @param {Function} onFulfilled
   * @param {Function} [onRejected]
   */
  Aigle.prototype.then = function then (onFulfilled, onRejected) {
    return addAigle(this, new Aigle(INTERNAL), onFulfilled, onRejected);
  };

  /**
   * @param {Object|Function} onRejected
   * @example
   * return Aigle.reject(new TypeError('error'))
   *   .catch(TypeError, error => console.log(error));
   */
  Aigle.prototype.catch = function catch$1 (onRejected) {
    var arguments$1 = arguments;

    if (arguments.length > 1) {
      var l = arguments.length;
      onRejected = arguments[--l];
      var errorTypes = Array(l);
      while (l--) {
        errorTypes[l] = arguments$1[l];
      }
      onRejected = createOnRejected(errorTypes, onRejected);
    }
    return addAigle(this, new Aigle(INTERNAL), undefined, onRejected);
  };

  /**
   * @param {Function} handler
   */
  Aigle.prototype.finally = function finally$1 (handler) {
    handler = typeof handler !== 'function' ? handler : createFinallyHandler(this, handler);
    return addAigle(this, new Aigle(INTERNAL), handler, handler);
  };

  /**
   * @param {Function} handler
   */
  Aigle.prototype.spread = function spread (handler) {
    return addReceiver(this, new Spread(handler));
  };

  Aigle.prototype.all = function all$1 () {
    return this.then(all);
  };

  Aigle.prototype.race = function race$1 () {
    return this.then(race);
  };

  Aigle.prototype.props = function props$1 () {
    return this.then(props);
  };

  Aigle.prototype.parallel = function parallel$1 () {
    return this.then(parallel);
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.each = function each$1 (iterator) {
    return this.then(function (value) { return each(value, iterator); });
  };

  /**
   * @alias each
   * @param {Function} iterator
   */
  Aigle.prototype.forEach = function forEach (iterator) {
    return this.each(iterator);
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.eachSeries = function eachSeries$1 (iterator) {
    return this.then(function (value) { return eachSeries(value, iterator); });
  };

  /**
   * @alias eachSeries
   * @param {Function} iterator
   */
  Aigle.prototype.forEachSeries = function forEachSeries (iterator) {
    return this.eachSeries(iterator);
  };

  /**
   * @param {number} [limit=8] - if you don't define, the default is 8
   * @param {Function} iterator
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
  Aigle.prototype.eachLimit = function eachLimit$1 (limit, iterator) {
    return this.then(function (value) { return eachLimit(value, limit, iterator); });
  };

  /**
   * @alias eachLimit
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.forEachLimit = function forEachLimit (limit, iterator) {
    return this.eachLimit(limit, iterator);
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.map = function map$1 (iterator) {
    return this.then(function (value) { return map(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.mapSeries = function mapSeries$1 (iterator) {
    return this.then(function (value) { return mapSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.mapLimit = function mapLimit$1 (limit, iterator) {
    return this.then(function (value) { return mapLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.mapValues = function mapValues$1 (iterator) {
    return this.then(function (value) { return mapValues(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.mapValuesSeries = function mapValuesSeries$1 (iterator) {
    return this.then(function (value) { return mapValuesSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.mapValuesLimit = function mapValuesLimit$1 (limit, iterator) {
    return this.then(function (value) { return mapValuesLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.filter = function filter$1 (iterator) {
    return this.then(function (value) { return filter(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.filterSeries = function filterSeries$1 (iterator) {
    return this.then(function (value) { return filterSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.filterLimit = function filterLimit$1 (limit, iterator) {
    return this.then(function (value) { return filterLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.reject = function reject$1 (iterator) {
    return this.then(function (value) { return reject(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.rejectSeries = function rejectSeries$1 (iterator) {
    return this.then(function (value) { return rejectSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.rejectLimit = function rejectLimit$1 (limit, iterator) {
    return this.then(function (value) { return rejectLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.find = function find$1 (iterator) {
    return this.then(function (value) { return find(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.findSeries = function findSeries$1 (iterator) {
    return this.then(function (value) { return findSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.findLimit = function findLimit$1 (limit, iterator) {
    return this.then(function (value) { return findLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.pick = function pick$1 (iterator) {
    return this.then(function (value) { return pick(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.pickSeries = function pickSeries$1 (iterator) {
    return this.then(function (value) { return pickSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.pickLimit = function pickLimit$1 (limit, iterator) {
    return this.then(function (value) { return pickLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.omit = function omit$1 (iterator) {
    return this.then(function (value) { return omit(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.omitSeries = function omitSeries$1 (iterator) {
    return this.then(function (value) { return omitSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.omitLimit = function omitLimit$1 (limit, iterator) {
    return this.then(function (value) { return omitLimit(value, limit, iterator); });
  };

  /**
   * @param {*} result
   * @param {Function} iterator
   */
  Aigle.prototype.reduce = function reduce$1 (result, iterator) {
    return this.then(function (value) { return reduce(value, result, iterator); });
  };

  /**
   * @param {Array|Object} result
   * @param {Function} iterator
   */
  Aigle.prototype.transform = function transform$1 (result, iterator) {
    return this.then(function (value) { return transform(value, result, iterator); });
  };

  /**
   * @param {Array|Object} result
   * @param {Function} iterator
   */
  Aigle.prototype.transformSeries = function transformSeries$1 (result, iterator) {
    return this.then(function (value) { return transformSeries(value, result, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Array|Object} result
   * @param {Function} iterator
   */
  Aigle.prototype.transformLimit = function transformLimit$1 (limit, result, iterator) {
    return this.then(function (value) { return transformLimit(value, limit, result, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.sortBy = function sortBy$1 (iterator) {
    return this.then(function (value) { return sortBy(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.sortBySeries = function sortBySeries$1 (iterator) {
    return this.then(function (value) { return sortBySeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.sortByLimit = function sortByLimit$1 (limit, iterator) {
    return this.then(function (value) { return sortByLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.some = function some$1 (iterator) {
    return this.then(function (value) { return some(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.someSeries = function someSeries$1 (iterator) {
    return this.then(function (value) { return someSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.someLimit = function someLimit$1 (limit, iterator) {
    return this.then(function (value) { return someLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.every = function every$1 (iterator) {
    return this.then(function (value) { return every(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.everySeries = function everySeries$1 (iterator) {
    return this.then(function (value) { return everySeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.everyLimit = function everyLimit$1 (limit, iterator) {
    return this.then(function (value) { return everyLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.concat = function concat$1 (iterator) {
    return this.then(function (value) { return concat(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.concatSeries = function concatSeries$1 (iterator) {
    return this.then(function (value) { return concatSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.concatLimit = function concatLimit$1 (limit, iterator) {
    return this.then(function (value) { return concatLimit(value, limit, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.groupBy = function groupBy$1 (iterator) {
    return this.then(function (value) { return groupBy(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.groupBySeries = function groupBySeries$1 (iterator) {
    return this.then(function (value) { return groupBySeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  Aigle.prototype.groupByLimit = function groupByLimit$1 (limit, iterator) {
    return this.then(function (value) { return groupByLimit(value, limit, iterator); });
  };

  /**
   * @param {number} ms
   */
  Aigle.prototype.delay = function delay (ms) {
    return addReceiver(this, new Delay(ms));
  };

  /**
   * @param {number} ms
   * @param {*} [message]
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
   */
  Aigle.prototype.doUntil = function doUntil$1 (iterator, tester) {
    return this.then(function (value) { return doUntil(value, iterator, tester); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.times = function times$1 (iterator) {
    return this.then(function (value) { return times(value, iterator); });
  };

  /**
   * @param {Function} iterator
   */
  Aigle.prototype.timesSeries = function timesSeries$1 (iterator) {
    return this.then(function (value) { return timesSeries(value, iterator); });
  };

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
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
    this._resolved = 1;
    this._value = value;
    if (this._receiver === undefined) {
      return;
    }
    var ref = this;
    var _receiver = ref._receiver;
    this._receiver = undefined;
    if (_receiver instanceof AigleProxy) {
      _receiver._callResolve(value, this._key);
    } else if (this._key === INTERNAL) {
      _receiver._resolve(value);
    } else {
      callResolve(_receiver, this._onFulfilled, value);
    }
    if (!this._receivers) {
      return;
    }
    var ref$1 = this;
    var _receivers = ref$1._receivers;
    this._receivers = undefined;
    while (_receivers.head) {
      var ref$2 = _receivers.shift();
      var receiver = ref$2.receiver;
      var onFulfilled = ref$2.onFulfilled;
      callResolve(receiver, onFulfilled, value);
    }
  };

  Aigle.prototype._reject = function _reject (reason) {
    this._resolved = 2;
    this._value = reason;
    if (this._receiver === undefined) {
      process.emit('unhandledRejection', reason);
      return;
    }
    var ref = this;
    var _receiver = ref._receiver;
    var _key = ref._key;
    this._receiver = undefined;
    if (_receiver instanceof AigleProxy) {
      _receiver._callReject(reason);
    } else if (_key === INTERNAL) {
      _receiver._reject(reason);
    } else {
      callReject(_receiver, this._onRejected, reason);
    }
    if (!this._receivers) {
      return;
    }
    var ref$1 = this;
    var _receivers = ref$1._receivers;
    this._receivers = undefined;
    while (_receivers.head) {
      var ref$2 = _receivers.shift();
      var receiver = ref$2.receiver;
      var onRejected = ref$2.onRejected;
      callReject(receiver, onRejected, reason);
    }
  };

  Aigle.prototype._addAigle = function _addAigle (receiver, onFulfilled, onRejected) {
    if (this._receiver === undefined) {
      this._receiver = receiver;
      this._onFulfilled = onFulfilled;
      this._onRejected = onRejected;
      return;
    }
    if (!this._receivers) {
      this._receivers = new Queue();
    }
    this._receivers.push(new Task(undefined, receiver, onFulfilled, onRejected));
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
var race = require('./race');
var ref$3 = require('./props');
var props = ref$3.props;
var parallel = require('./parallel');
var each = require('./each');
var eachSeries = require('./eachSeries');
var eachLimit = require('./eachLimit');
var map = require('./map');
var mapSeries = require('./mapSeries');
var ref$4 = require('./mapLimit');
var mapLimit = ref$4.mapLimit;
var mapValues = require('./mapValues');
var mapValuesSeries = require('./mapValuesSeries');
var ref$5 = require('./mapValuesLimit');
var mapValuesLimit = ref$5.mapValuesLimit;
var filter = require('./filter');
var filterSeries = require('./filterSeries');
var ref$6 = require('./filterLimit');
var filterLimit = ref$6.filterLimit;
var reject = require('./reject');
var rejectSeries = require('./rejectSeries');
var ref$7 = require('./rejectLimit');
var rejectLimit = ref$7.rejectLimit;
var find = require('./find');
var findSeries = require('./findSeries');
var ref$8 = require('./findLimit');
var findLimit = ref$8.findLimit;
var pick = require('./pick');
var pickSeries = require('./pickSeries');
var ref$9 = require('./pickLimit');
var pickLimit = ref$9.pickLimit;
var omit = require('./omit');
var omitSeries = require('./omitSeries');
var ref$10 = require('./omitLimit');
var omitLimit = ref$10.omitLimit;
var reduce = require('./reduce');
var transform = require('./transform');
var transformSeries = require('./transformSeries');
var transformLimit = require('./transformLimit');
var sortBy = require('./sortBy');
var sortBySeries = require('./sortBySeries');
var sortByLimit = require('./sortByLimit');
var some = require('./some');
var someSeries = require('./someSeries');
var someLimit = require('./someLimit');
var every = require('./every');
var everySeries = require('./everySeries');
var everyLimit = require('./everyLimit');
var concat = require('./concat');
var concatSeries = require('./concatSeries');
var concatLimit = require('./concatLimit');
var groupBy = require('./groupBy');
var groupBySeries = require('./groupBySeries');
var groupByLimit = require('./groupByLimit');
var ref$11 = require('./join');
var join = ref$11.join;
var Spread = ref$11.Spread;
var ref$12 = require('./delay');
var delay = ref$12.delay;
var Delay = ref$12.Delay;
var Timeout = require('./timeout');
var ref$13 = require('./whilst');
var whilst = ref$13.whilst;
var ref$14 = require('./doWhilst');
var doWhilst = ref$14.doWhilst;
var ref$15 = require('./until');
var until = ref$15.until;
var doUntil = require('./doUntil');
var retry = require('./retry');
var times = require('./times');
var timesSeries = require('./timesSeries');
var timesLimit = require('./timesLimit');
var ref$16 = require('./using');
var using = ref$16.using;
var Disposer = ref$16.Disposer;

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

/* errors */
var ref$17 = require('./error');
var TimeoutError = ref$17.TimeoutError;
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
  promise._resolved = 2;
  promise._value = reason;
  return promise;
}

module.exports = Aigle;

function execute(promise, executor) {
  try {
    executor(resolve, reject);
  } catch(e) {
    reject(e);
  }

  function resolve(value) {
    if (promise._resolved !== 0) {
      return;
    }
    promise._resolve(value);
  }

  function reject(reason) {
    if (promise._resolved !== 0) {
      return;
    }
    promise._reject(reason);
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

function createOnRejected(errorTypes, onRejected) {
  return function (reason) {
    var l = errorTypes.length;
    while (l--) {
      if (reason instanceof errorTypes[l]) {
        return onRejected(reason);
      }
    }
    return Aigle.reject(reason);
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

function tick() {
  while (queue.head) {
    var task = queue.shift();
    var promise = task.promise;
    var receiver = task.receiver;
    var _resolved = promise._resolved;
    var _value = promise._value;
    if (_resolved === 1) {
      if (receiver instanceof AigleProxy) {
        receiver._callResolve(_value, promise._key);
      } else {
        callResolve(receiver, task.onFulfilled, _value);
      }
    } else {
      if (receiver instanceof AigleProxy) {
        receiver._callReject(_value, promise._key);
      } else {
        callReject(receiver, task.onRejected, _value);
      }
    }
  }
}

function push(promise, receiver, onFulfilled, onRejected) {
  if (!queue.head) {
    setImmediate(tick);
  }
  queue.push(new Task(promise, receiver, onFulfilled, onRejected));
}

function addAigle(promise, receiver, onFulfilled, onRejected) {
  if (promise._resolved === 0) {
    promise._addAigle(receiver, onFulfilled, onRejected);
  } else {
    push(promise, receiver, onFulfilled, onRejected);
  }
  return receiver;
}

function addReceiver(promise, receiver) {
  if (promise._resolved === 0) {
    promise._addReceiver(receiver);
  } else {
    push(promise, receiver);
  }
  return receiver._promise;
}

}).call(this,require('_process'))
},{"./all":3,"./concat":4,"./concatLimit":5,"./concatSeries":6,"./delay":7,"./doUntil":8,"./doWhilst":9,"./each":10,"./eachLimit":11,"./eachSeries":12,"./error":13,"./every":14,"./everyLimit":15,"./everySeries":16,"./filter":17,"./filterLimit":18,"./filterSeries":19,"./find":20,"./findLimit":21,"./findSeries":22,"./groupBy":23,"./groupByLimit":24,"./groupBySeries":25,"./internal/queue":28,"./internal/task":29,"./internal/util":30,"./join":31,"./map":32,"./mapLimit":33,"./mapSeries":34,"./mapValues":35,"./mapValuesLimit":36,"./mapValuesSeries":37,"./omit":38,"./omitLimit":39,"./omitSeries":40,"./parallel":41,"./pick":42,"./pickLimit":43,"./pickSeries":44,"./promisify":45,"./promisifyAll":46,"./props":47,"./race":48,"./reduce":49,"./reject":50,"./rejectLimit":51,"./rejectSeries":52,"./retry":53,"./some":54,"./someLimit":55,"./someSeries":56,"./sortBy":57,"./sortByLimit":58,"./sortBySeries":59,"./timeout":60,"./times":61,"./timesLimit":62,"./timesSeries":63,"./transform":64,"./transformLimit":65,"./transformSeries":66,"./until":67,"./using":68,"./whilst":69,"_process":71,"aigle-core":70}],3:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var promiseArrayEach = ref$2.promiseArrayEach;

var AigleAll = (function (AigleProxy) {
  function AigleAll(array) {
    AigleProxy.call(this);
    var size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._result = Array(size);
    if (size === 0) {
      this._promise._resolve(this._result);
    } else {
      promiseArrayEach(this);
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

function all(array) {
  return new AigleAll(array)._promise;
}


},{"./aigle":2,"./internal/util":30,"aigle-core":70}],4:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var ConcatArray = (function (AigleEachArray) {
  function ConcatArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = [];
  }

  if ( AigleEachArray ) ConcatArray.__proto__ = AigleEachArray;
  ConcatArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  ConcatArray.prototype.constructor = ConcatArray;

  ConcatArray.prototype._callResolve = function _callResolve (value) {
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

  return ConcatArray;
}(AigleEachArray));

var ConcatObject = (function (AigleEachObject) {
  function ConcatObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = [];
  }

  if ( AigleEachObject ) ConcatObject.__proto__ = AigleEachObject;
  ConcatObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  ConcatObject.prototype.constructor = ConcatObject;

  ConcatObject.prototype._callResolve = function _callResolve (value) {
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

  return ConcatObject;
}(AigleEachObject));

module.exports = concat;

function concat(collection, iterator) {
  if (Array.isArray(collection)) {
    return new ConcatArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new ConcatObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleEach":26}],5:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var ConcatLimitArray = (function (AigleLimitArray) {
  function ConcatLimitArray(object, iterator, limit) {
    AigleLimitArray.call(this, object, iterator, limit);
    this._result = [];
  }

  if ( AigleLimitArray ) ConcatLimitArray.__proto__ = AigleLimitArray;
  ConcatLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  ConcatLimitArray.prototype.constructor = ConcatLimitArray;

  ConcatLimitArray.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (Array.isArray(value)) {
      (ref = this._result).push.apply(ref, value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
    var ref;
  };

  return ConcatLimitArray;
}(AigleLimitArray));
var ConcatLimitObject = (function (AigleLimitObject) {
  function ConcatLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = [];
  }

  if ( AigleLimitObject ) ConcatLimitObject.__proto__ = AigleLimitObject;
  ConcatLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  ConcatLimitObject.prototype.constructor = ConcatLimitObject;

  ConcatLimitObject.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (Array.isArray(value)) {
      (ref = this._result).push.apply(ref, value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
    var ref;
  };

  return ConcatLimitObject;
}(AigleLimitObject));

module.exports = concatLimit;

function concatLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new ConcatLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new ConcatLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleLimit":27}],6:[function(require,module,exports){
'use strict';

var concatLimit = require('./concatLimit');

module.exports = concatSeries;

function concatSeries(collection, iterator) {
  return concatLimit(collection, 1, iterator);
}

},{"./concatLimit":5}],7:[function(require,module,exports){
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

function delay(ms, value) {
  var delay = new Delay(ms);
  delay._callResolve(value);
  return delay._promise;
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],8:[function(require,module,exports){
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
 */
function doUntil(value, iterator, tester) {
  if (typeof tester !== 'function') {
    tester = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoWhilst(new UntilTester(tester), iterator)._iterate(value);
}

},{"./doWhilst":9,"./until":67}],9:[function(require,module,exports){
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
 */
function doWhilst(value, iterator, tester) {
  if (typeof tester !== 'function') {
    tester = iterator;
    iterator = value;
    value = undefined;
  }
  return new DoWhilst(new WhilstTester(tester), iterator)._iterate(value);
}

},{"./whilst":69}],10:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

module.exports = each;

function each(collection, iterator) {
  if (Array.isArray(collection)) {
    return new AigleEachArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new AigleEachObject(collection, iterator)._iterate();
  }
  return Aigle.resolve();
}

},{"./aigle":2,"./internal/aigleEach":26}],11:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

module.exports = eachLimit;

function eachLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new AigleLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new AigleLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve();
}


},{"./aigle":2,"./internal/aigleLimit":27}],12:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

module.exports = eachSeries;

function eachSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new AigleLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new AigleLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve();
}


},{"./aigle":2,"./internal/aigleLimit":27}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var EveryArray = (function (AigleEachArray) {
  function EveryArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = true;
  }

  if ( AigleEachArray ) EveryArray.__proto__ = AigleEachArray;
  EveryArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  EveryArray.prototype.constructor = EveryArray;

  EveryArray.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    }
  };

  return EveryArray;
}(AigleEachArray));

var EveryObject = (function (AigleEachObject) {
  function EveryObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = true;
  }

  if ( AigleEachObject ) EveryObject.__proto__ = AigleEachObject;
  EveryObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  EveryObject.prototype.constructor = EveryObject;

  EveryObject.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    }
  };

  return EveryObject;
}(AigleEachObject));

module.exports = every;

function every(collection, iterator) {
  if (Array.isArray(collection)) {
    return new EveryArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new EveryObject(collection, iterator)._iterate();
  }
  return Aigle.resolve(true);
}

},{"./aigle":2,"./internal/aigleEach":26}],15:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var EveryLimitArray = (function (AigleLimitArray) {
  function EveryLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = true;
  }

  if ( AigleLimitArray ) EveryLimitArray.__proto__ = AigleLimitArray;
  EveryLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  EveryLimitArray.prototype.constructor = EveryLimitArray;

  EveryLimitArray.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return EveryLimitArray;
}(AigleLimitArray));
var EveryLimitObject = (function (AigleLimitObject) {
  function EveryLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = true;
  }

  if ( AigleLimitObject ) EveryLimitObject.__proto__ = AigleLimitObject;
  EveryLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  EveryLimitObject.prototype.constructor = EveryLimitObject;

  EveryLimitObject.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return EveryLimitObject;
}(AigleLimitObject));

module.exports = everyLimit;

function everyLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new EveryLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new EveryLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve(true);
}

},{"./aigle":2,"./internal/aigleLimit":27}],16:[function(require,module,exports){
'use strict';

var everyLimit = require('./everyLimit');

module.exports = everySeries;

function everySeries(collection, iterator) {
  return everyLimit(collection, 1, iterator);
}

},{"./everyLimit":15}],17:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/util');
var INTERNAL = ref$1.INTERNAL;
var compactArray = ref$1.compactArray;
var ref$2 = require('./internal/aigleEach');
var AigleEachArray = ref$2.AigleEachArray;
var AigleEachObject = ref$2.AigleEachObject;

var FilterArray = (function (AigleEachArray) {
  function FilterArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachArray ) FilterArray.__proto__ = AigleEachArray;
  FilterArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  FilterArray.prototype.constructor = FilterArray;

  FilterArray.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  };

  return FilterArray;
}(AigleEachArray));

var FilterObject = (function (AigleEachObject) {
  function FilterObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachObject ) FilterObject.__proto__ = AigleEachObject;
  FilterObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  FilterObject.prototype.constructor = FilterObject;

  FilterObject.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  };

  return FilterObject;
}(AigleEachObject));

module.exports = filter;

function filter(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FilterArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FilterObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleEach":26,"./internal/util":30}],18:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/util');
var INTERNAL = ref$1.INTERNAL;
var compactArray = ref$1.compactArray;
var ref$2 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
var AigleLimitArray = ref$2.AigleLimitArray;
var AigleLimitObject = ref$2.AigleLimitObject;

var FilterLimitArray = (function (AigleLimitArray) {
  function FilterLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitArray ) FilterLimitArray.__proto__ = AigleLimitArray;
  FilterLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  FilterLimitArray.prototype.constructor = FilterLimitArray;

  FilterLimitArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return FilterLimitArray;
}(AigleLimitArray));
var FilterLimitObject = (function (AigleLimitObject) {
  function FilterLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitObject ) FilterLimitObject.__proto__ = AigleLimitObject;
  FilterLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  FilterLimitObject.prototype.constructor = FilterLimitObject;

  FilterLimitObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return FilterLimitObject;
}(AigleLimitObject));

module.exports = { filterLimit: filterLimit, FilterLimitArray: FilterLimitArray, FilterLimitObject: FilterLimitObject };

function filterLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new FilterLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FilterLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleLimit":27,"./internal/util":30}],19:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./filterLimit');
var FilterLimitArray = ref$1.FilterLimitArray;
var FilterLimitObject = ref$1.FilterLimitObject;

module.exports = filterSeries;

function filterSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FilterLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FilterLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./filterLimit":18}],20:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var FindArray = (function (AigleEachArray) {
  function FindArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
  }

  if ( AigleEachArray ) FindArray.__proto__ = AigleEachArray;
  FindArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  FindArray.prototype.constructor = FindArray;

  FindArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  };

  return FindArray;
}(AigleEachArray));

var FindObject = (function (AigleEachObject) {
  function FindObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
  }

  if ( AigleEachObject ) FindObject.__proto__ = AigleEachObject;
  FindObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  FindObject.prototype.constructor = FindObject;

  FindObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  };

  return FindObject;
}(AigleEachObject));

module.exports = find;

function find(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FindArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FindObject(collection, iterator)._iterate();
  }
  return Aigle.resolve();
}

},{"./aigle":2,"./internal/aigleEach":26}],21:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var FindLimitArray = (function (AigleLimitArray) {
  function FindLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
  }

  if ( AigleLimitArray ) FindLimitArray.__proto__ = AigleLimitArray;
  FindLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  FindLimitArray.prototype.constructor = FindLimitArray;

  FindLimitArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return FindLimitArray;
}(AigleLimitArray));
var FindLimitObject = (function (AigleLimitObject) {
  function FindLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
  }

  if ( AigleLimitObject ) FindLimitObject.__proto__ = AigleLimitObject;
  FindLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  FindLimitObject.prototype.constructor = FindLimitObject;

  FindLimitObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return FindLimitObject;
}(AigleLimitObject));

module.exports = { findLimit: findLimit, FindLimitArray: FindLimitArray, FindLimitObject: FindLimitObject };

function findLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new FindLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FindLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve();
}

},{"./aigle":2,"./internal/aigleLimit":27}],22:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./findLimit');
var FindLimitArray = ref$1.FindLimitArray;
var FindLimitObject = ref$1.FindLimitObject;

module.exports = findSeries;

function findSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FindLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FindLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve();
}

},{"./aigle":2,"./findLimit":21}],23:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var GroupByArray = (function (AigleEachArray) {
  function GroupByArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = {};
  }

  if ( AigleEachArray ) GroupByArray.__proto__ = AigleEachArray;
  GroupByArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  GroupByArray.prototype.constructor = GroupByArray;

  GroupByArray.prototype._callResolve = function _callResolve (key, index) {
    if (this._result[key]) {
      this._result[key].push(this._array[index]);
    } else {
      this._result[key] = [this._array[index]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return GroupByArray;
}(AigleEachArray));

var GroupByObject = (function (AigleEachObject) {
  function GroupByObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = {};
  }

  if ( AigleEachObject ) GroupByObject.__proto__ = AigleEachObject;
  GroupByObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  GroupByObject.prototype.constructor = GroupByObject;

  GroupByObject.prototype._callResolve = function _callResolve (key, index) {
    if (this._result[key]) {
      this._result[key].push(this._object[this._keys[index]]);
    } else {
      this._result[key] = [this._object[this._keys[index]]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return GroupByObject;
}(AigleEachObject));

module.exports = groupBy;

function groupBy(collection, iterator) {
  if (Array.isArray(collection)) {
    return new GroupByArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new GroupByObject(collection, iterator)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleEach":26}],24:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var GroupByLimitArray = (function (AigleLimitArray) {
  function GroupByLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitArray ) GroupByLimitArray.__proto__ = AigleLimitArray;
  GroupByLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  GroupByLimitArray.prototype.constructor = GroupByLimitArray;

  GroupByLimitArray.prototype._callResolve = function _callResolve (key, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (this._result[key]) {
      this._result[key].push(this._array[index]);
    } else {
      this._result[key] = [this._array[index]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return GroupByLimitArray;
}(AigleLimitArray));
var GroupByLimitObject = (function (AigleLimitObject) {
  function GroupByLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitObject ) GroupByLimitObject.__proto__ = AigleLimitObject;
  GroupByLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  GroupByLimitObject.prototype.constructor = GroupByLimitObject;

  GroupByLimitObject.prototype._callResolve = function _callResolve (key, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (this._result[key]) {
      this._result[key].push(this._object[this._keys[index]]);
    } else {
      this._result[key] = [this._object[this._keys[index]]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return GroupByLimitObject;
}(AigleLimitObject));

module.exports = groupByLimit;

function groupByLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new GroupByLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new GroupByLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleLimit":27}],25:[function(require,module,exports){
'use strict';

var groupByLimit = require('./groupByLimit');

module.exports = groupBySeries;

function groupBySeries(collection, iterator) {
  return groupByLimit(collection, 1, iterator);
}

},{"./groupByLimit":24}],26:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('../aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./util');
var INTERNAL = ref$2.INTERNAL;
var call2 = ref$2.call2;
var callProxyReciever = ref$2.callProxyReciever;

var AigleEachArray = (function (AigleProxy) {
  function AigleEachArray(array, iterator) {
    AigleProxy.call(this);
    var size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  if ( AigleProxy ) AigleEachArray.__proto__ = AigleProxy;
  AigleEachArray.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleEachArray.prototype.constructor = AigleEachArray;

  AigleEachArray.prototype._iterate = function _iterate () {
    var i = -1;
    var ref = this;
    var _rest = ref._rest;
    var _iterator = ref._iterator;
    var _array = ref._array;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (++i < _rest && callProxyReciever(call2(_iterator, _array[i], i), this, i)) {}
    }
    return this._promise;
  };

  AigleEachArray.prototype._callResolve = function _callResolve (value) {
    if (value === false) {
      this._promise._resolved === 0 & this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  };

  AigleEachArray.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleEachArray;
}(AigleProxy));

var AigleEachObject = (function (AigleProxy) {
  function AigleEachObject(object, iterator) {
    AigleProxy.call(this);
    var keys = Object.keys(object);
    var size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
  }

  if ( AigleProxy ) AigleEachObject.__proto__ = AigleProxy;
  AigleEachObject.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleEachObject.prototype.constructor = AigleEachObject;

  AigleEachObject.prototype._iterate = function _iterate () {
    var this$1 = this;

    var i = -1;
    var ref = this;
    var _rest = ref._rest;
    var _iterator = ref._iterator;
    var _keys = ref._keys;
    var _object = ref._object;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (++i < _rest) {
        var key = _keys[i];
        if (callProxyReciever(call2(_iterator, _object[key], key), this$1, i) === false) {
          break;
        }
      }
    }
    return this._promise;
  };

  AigleEachObject.prototype._callResolve = function _callResolve (value) {
    if (value === false) {
      this._promise._resolved === 0 & this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  };

  AigleEachObject.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleEachObject;
}(AigleProxy));

module.exports = { AigleEachArray: AigleEachArray, AigleEachObject: AigleEachObject };

},{"../aigle":2,"./util":30,"aigle-core":70}],27:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('../aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./util');
var INTERNAL = ref$2.INTERNAL;
var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
var call2 = ref$2.call2;
var callProxyReciever = ref$2.callProxyReciever;

var AigleLimitArray = (function (AigleProxy) {
  function AigleLimitArray(array, iterator, limit) {
    AigleProxy.call(this);
    var size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  if ( AigleProxy ) AigleLimitArray.__proto__ = AigleProxy;
  AigleLimitArray.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleLimitArray.prototype.constructor = AigleLimitArray;

  AigleLimitArray.prototype._iterate = function _iterate () {
    var this$1 = this;

    if (this._limit >= 1) {
      while (this._limit--) {
        this$1._next();
      }
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  };

  AigleLimitArray.prototype._next = function _next () {
    var i = this._index++;
    callProxyReciever(call2(this._iterator, this._array[i], i), this, i);
  };

  AigleLimitArray.prototype._callResolve = function _callResolve (value) {
    if (value === false) {
      this._promise._resolved === 0 && this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._promise._resolved === 0 && this._next();
    }
  };

  AigleLimitArray.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleLimitArray;
}(AigleProxy));

var AigleLimitObject = (function (AigleProxy) {
  function AigleLimitObject(object, iterator, limit) {
    AigleProxy.call(this);
    var keys = Object.keys(object);
    var size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._keys = keys;
    this._rest = size;
    this._size = size;
    this._object = object;
    this._result = undefined;
    this._iterator = iterator;
  }

  if ( AigleProxy ) AigleLimitObject.__proto__ = AigleProxy;
  AigleLimitObject.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  AigleLimitObject.prototype.constructor = AigleLimitObject;

  AigleLimitObject.prototype._iterate = function _iterate () {
    var this$1 = this;

    if (this._limit >= 1) {
      while (this._limit--) {
        this$1._next();
      }
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  };

  AigleLimitObject.prototype._next = function _next () {
    var i = this._index++;
    var key = this._keys[i];
    callProxyReciever(call2(this._iterator, this._object[key], key), this, i);
  };

  AigleLimitObject.prototype._callResolve = function _callResolve (value) {
    if (value === false) {
      this._promise._resolved === 0 && this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._promise._resolved === 0 && this._next();
    }
  };

  AigleLimitObject.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return AigleLimitObject;
}(AigleProxy));

module.exports = { DEFAULT_LIMIT: DEFAULT_LIMIT, AigleLimitArray: AigleLimitArray, AigleLimitObject: AigleLimitObject };

},{"../aigle":2,"./util":30,"aigle-core":70}],28:[function(require,module,exports){
'use strict';

var Queue = function Queue() {
  this.tail = undefined;
  this.head = undefined;
};

Queue.prototype.push = function push (task) {
  var tail = this.tail;
  this.tail = task;
  if (tail) {
    tail.tail = task;
  } else {
    this.head = task;
  }
};

Queue.prototype.shift = function shift () {
  var head = this.head;
  this.head = head.tail;
  if (!this.head) {
    this.tail = null;
  }
  return head;
};

module.exports = Queue;

},{}],29:[function(require,module,exports){
'use strict';

var Task = function Task(promise, receiver, onFulfilled, onRejected) {
  this.promise = promise;
  this.receiver = receiver;
  this.onFulfilled = onFulfilled;
  this.onRejected = onRejected;
  this.head = undefined;
  this.tail = undefined;
};

module.exports = Task;

},{}],30:[function(require,module,exports){
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
  errorObj: errorObj,
  call0: call0,
  call1: call1,
  call2: call2,
  call3: call3,
  callThen: callThen,
  callProxyReciever: callProxyReciever,
  apply: apply,
  promiseArrayEach: promiseArrayEach,
  promiseObjectEach: promiseObjectEach,
  compactArray: compactArray,
  clone: clone,
  sort: sort
};

function INTERNAL() {}

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
  if (promise === errorObj) {
    receiver._callReject(errorObj.e);
    return false;
  }
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
  if (promise && promise.then) {
    callProxyThen(promise, receiver, index);
  } else {
    receiver._callResolve(promise, index);
  }
  return true;
}

function promiseArrayEach(receiver) {
  var _array = receiver._array;
  var l = _array.length;
  while (l--) {
    var promise = _array[l];
    if (promise instanceof AigleCore) {
      switch (promise._resolved) {
      case 0:
        promise._addReceiver(receiver, l);
        continue;
      case 1:
        receiver._callResolve(promise._value, l);
        continue;
      case 2:
        receiver._callReject(promise._value);
        return;
      }
    }
    if (promise && promise.then) {
      callProxyThen(promise, receiver, l);
    } else {
      receiver._callResolve(promise, l);
    }
  }
}

function promiseObjectEach(receiver) {
  var _keys = receiver._keys;
  var _object = receiver._object;
  var l = _keys.length;
  while (l--) {
    var key = _keys[l];
    var promise = _object[key];
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

},{"../../package.json":73,"aigle-core":70}],31:[function(require,module,exports){
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

var SPREAD = {};

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
    if (index === SPREAD) {
      return this._promise._resolve(value);
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      spread(this, this._result);
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
    if (index === SPREAD) {
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
    return callProxyReciever(call1(_handler, array), proxy, SPREAD);
  }
  callProxyReciever(apply(_handler, array), proxy, SPREAD);
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],32:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var MapArray = (function (AigleEachArray) {
  function MapArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachArray ) MapArray.__proto__ = AigleEachArray;
  MapArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  MapArray.prototype.constructor = MapArray;

  MapArray.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return MapArray;
}(AigleEachArray));

var MapObject = (function (AigleEachObject) {
  function MapObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachObject ) MapObject.__proto__ = AigleEachObject;
  MapObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  MapObject.prototype.constructor = MapObject;

  MapObject.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return MapObject;
}(AigleEachObject));

module.exports = map;

function map(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleEach":26}],33:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var MapLimitArray = (function (AigleLimitArray) {
  function MapLimitArray(object, iterator, limit) {
    AigleLimitArray.call(this, object, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitArray ) MapLimitArray.__proto__ = AigleLimitArray;
  MapLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  MapLimitArray.prototype.constructor = MapLimitArray;

  MapLimitArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return MapLimitArray;
}(AigleLimitArray));
var MapLimitObject = (function (AigleLimitObject) {
  function MapLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitObject ) MapLimitObject.__proto__ = AigleLimitObject;
  MapLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  MapLimitObject.prototype.constructor = MapLimitObject;

  MapLimitObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return MapLimitObject;
}(AigleLimitObject));

module.exports = { mapLimit: mapLimit, MapLimitArray: MapLimitArray, MapLimitObject: MapLimitObject };

function mapLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new MapLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}


},{"./aigle":2,"./internal/aigleLimit":27}],34:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./mapLimit');
var MapLimitArray = ref$1.MapLimitArray;
var MapLimitObject = ref$1.MapLimitObject;

module.exports = mapSeries;

function mapSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./mapLimit":33}],35:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var MapValuesArray = (function (AigleEachArray) {
  function MapValuesArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = {};
  }

  if ( AigleEachArray ) MapValuesArray.__proto__ = AigleEachArray;
  MapValuesArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  MapValuesArray.prototype.constructor = MapValuesArray;

  MapValuesArray.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return MapValuesArray;
}(AigleEachArray));

var MapValuesObject = (function (AigleEachObject) {
  function MapValuesObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = {};
  }

  if ( AigleEachObject ) MapValuesObject.__proto__ = AigleEachObject;
  MapValuesObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  MapValuesObject.prototype.constructor = MapValuesObject;

  MapValuesObject.prototype._callResolve = function _callResolve (value, index) {
    this._result[this._keys[index]] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return MapValuesObject;
}(AigleEachObject));

module.exports = mapValues;

function mapValues(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapValuesArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapValuesObject(collection, iterator)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleEach":26}],36:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var MapValuesLimitArray = (function (AigleLimitArray) {
  function MapValuesLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitArray ) MapValuesLimitArray.__proto__ = AigleLimitArray;
  MapValuesLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  MapValuesLimitArray.prototype.constructor = MapValuesLimitArray;

  MapValuesLimitArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return MapValuesLimitArray;
}(AigleLimitArray));
var MapValuesLimitObject = (function (AigleLimitObject) {
  function MapValuesLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitObject ) MapValuesLimitObject.__proto__ = AigleLimitObject;
  MapValuesLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  MapValuesLimitObject.prototype.constructor = MapValuesLimitObject;

  MapValuesLimitObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[this._keys[index]] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return MapValuesLimitObject;
}(AigleLimitObject));

module.exports = { mapValuesLimit: mapValuesLimit, MapValuesLimitArray: MapValuesLimitArray, MapValuesLimitObject: MapValuesLimitObject };

function mapValuesLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new MapValuesLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapValuesLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleLimit":27}],37:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./mapValuesLimit');
var MapValuesLimitArray = ref$1.MapValuesLimitArray;
var MapValuesLimitObject = ref$1.MapValuesLimitObject;

module.exports = mapValuesSeries;

function mapValuesSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapValuesLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapValuesLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./mapValuesLimit":36}],38:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var OmitArray = (function (AigleEachArray) {
  function OmitArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = {};
  }

  if ( AigleEachArray ) OmitArray.__proto__ = AigleEachArray;
  OmitArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  OmitArray.prototype.constructor = OmitArray;

  OmitArray.prototype._callResolve = function _callResolve (value, index) {
    if (!value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return OmitArray;
}(AigleEachArray));

var OmitObject = (function (AigleEachObject) {
  function OmitObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = {};
  }

  if ( AigleEachObject ) OmitObject.__proto__ = AigleEachObject;
  OmitObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  OmitObject.prototype.constructor = OmitObject;

  OmitObject.prototype._callResolve = function _callResolve (value, index) {
    if (!value) {
      var key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return OmitObject;
}(AigleEachObject));

module.exports = omit;

function omit(collection, iterator) {
  if (Array.isArray(collection)) {
    return new OmitArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new OmitObject(collection, iterator)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleEach":26}],39:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var OmitLimitArray = (function (AigleLimitArray) {
  function OmitLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitArray ) OmitLimitArray.__proto__ = AigleLimitArray;
  OmitLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  OmitLimitArray.prototype.constructor = OmitLimitArray;

  OmitLimitArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return OmitLimitArray;
}(AigleLimitArray));
var OmitLimitObject = (function (AigleLimitObject) {
  function OmitLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitObject ) OmitLimitObject.__proto__ = AigleLimitObject;
  OmitLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  OmitLimitObject.prototype.constructor = OmitLimitObject;

  OmitLimitObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      var key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return OmitLimitObject;
}(AigleLimitObject));

module.exports = { omitLimit: omitLimit, OmitLimitArray: OmitLimitArray, OmitLimitObject: OmitLimitObject };

function omitLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new OmitLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new OmitLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleLimit":27}],40:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./omitLimit');
var OmitLimitArray = ref$1.OmitLimitArray;
var OmitLimitObject = ref$1.OmitLimitObject;

module.exports = omitSeries;

function omitSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new OmitLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new OmitLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./omitLimit":39}],41:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./all');
var AigleAll = ref$1.AigleAll;
var ref$2 = require('./props');
var AigleProps = ref$2.AigleProps;

module.exports = parallel;

function parallel(collection) {
  if (Array.isArray(collection)) {
    return new AigleAll(collection)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new AigleProps(collection)._promise;
  }
  return Aigle.resolve({});
}


},{"./aigle":2,"./all":3,"./props":47}],42:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var PickArray = (function (AigleEachArray) {
  function PickArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = {};
  }

  if ( AigleEachArray ) PickArray.__proto__ = AigleEachArray;
  PickArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  PickArray.prototype.constructor = PickArray;

  PickArray.prototype._callResolve = function _callResolve (value, index) {
    if (value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return PickArray;
}(AigleEachArray));

var PickObject = (function (AigleEachObject) {
  function PickObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = {};
  }

  if ( AigleEachObject ) PickObject.__proto__ = AigleEachObject;
  PickObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  PickObject.prototype.constructor = PickObject;

  PickObject.prototype._callResolve = function _callResolve (value, index) {
    if (value) {
      var key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  return PickObject;
}(AigleEachObject));

module.exports = pick;

function pick(collection, iterator) {
  if (Array.isArray(collection)) {
    return new PickArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new PickObject(collection, iterator)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleEach":26}],43:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var PickLimitArray = (function (AigleLimitArray) {
  function PickLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitArray ) PickLimitArray.__proto__ = AigleLimitArray;
  PickLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  PickLimitArray.prototype.constructor = PickLimitArray;

  PickLimitArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return PickLimitArray;
}(AigleLimitArray));
var PickLimitObject = (function (AigleLimitObject) {
  function PickLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = {};
  }

  if ( AigleLimitObject ) PickLimitObject.__proto__ = AigleLimitObject;
  PickLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  PickLimitObject.prototype.constructor = PickLimitObject;

  PickLimitObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      var key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return PickLimitObject;
}(AigleLimitObject));

module.exports = { pickLimit: pickLimit, PickLimitArray: PickLimitArray, PickLimitObject: PickLimitObject };

function pickLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new PickLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new PickLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./internal/aigleLimit":27}],44:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./pickLimit');
var PickLimitArray = ref$1.PickLimitArray;
var PickLimitObject = ref$1.PickLimitObject;

module.exports = pickSeries;

function pickSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new PickLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new PickLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve({});
}

},{"./aigle":2,"./pickLimit":43}],45:[function(require,module,exports){
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
 */
function promisify(fn, opts) {
  switch (typeof fn) {
  case 'object':
    switch (typeof opts) {
    case 'string':
    case 'number':
      return makeFunctionByKey(fn, opts);
    default:
      throw new TypeError('Second argument is invalid');
    }
  case 'function':
    var ctx = opts && opts.context !== undefined ? opts.context : undefined;
    return makeFunction(fn, ctx);
  default:
    throw new TypeError('Type of first argument is not function');
  }
}

function makeCallback(promise) {
  return function (err, res) {
    if (err) {
      promise._reject(err);
    } else {
      promise._resolve(res);
    }
  };
}

function makeFunctionByKey(obj, key) {

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

function makeFunction(fn, ctx) {

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

},{"./aigle":2,"./internal/util":30}],46:[function(require,module,exports){
'use strict';

var promisify = require('./promisify');

module.exports = promisifyAll;

/**
 * @param {Object} target
 * @param {Object} [opts]
 * @param {String} [opts.suffix=Async]
 * @param {Function} [opts.filter]
 * @param {Function} [opts.depth=2]
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
        throw new TypeError(("Cannot promisify an API that has normal methods with '" + suffix + "'-suffix"));
      }
      target[_key] = promisify(obj);
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
    if (memo[key] === true || key === 'constructor' || filter(key)) {
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

},{"./promisify":45}],47:[function(require,module,exports){
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
    this._object = object;
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

function props(object) {
  return new AigleProps(object)._promise;
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],48:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var promiseArrayEach = ref$2.promiseArrayEach;
var promiseObjectEach = ref$2.promiseObjectEach;

var RaceArray = (function (AigleProxy) {
  function RaceArray(array) {
    AigleProxy.call(this);
    var size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    if (size === 0) {
      this._promise._resolve();
    } else {
      promiseArrayEach(this);
    }
  }

  if ( AigleProxy ) RaceArray.__proto__ = AigleProxy;
  RaceArray.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  RaceArray.prototype.constructor = RaceArray;

  RaceArray.prototype._callResolve = function _callResolve (value) {
    this._promise._resolved === 0 && this._promise._resolve(value);
  };

  RaceArray.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return RaceArray;
}(AigleProxy));

var RaceObject = (function (AigleProxy) {
  function RaceObject(object) {
    AigleProxy.call(this);
    var keys = Object.keys(object);
    var size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    if (size === 0) {
      this._promise._resolve();
    } else {
      promiseObjectEach(this);
    }
  }

  if ( AigleProxy ) RaceObject.__proto__ = AigleProxy;
  RaceObject.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  RaceObject.prototype.constructor = RaceObject;

  RaceObject.prototype._callResolve = function _callResolve (value) {
    this._promise._resolved === 0 && this._promise._resolve(value);
  };

  RaceObject.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return RaceObject;
}(AigleProxy));

module.exports = race;

/**
 * @param {Object|Array} collection
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

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],49:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var call3 = ref$2.call3;
var callProxyReciever = ref$2.callProxyReciever;

var ReduceArray = (function (AigleProxy) {
  function ReduceArray(array, iterator, result) {
    AigleProxy.call(this);
    var size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._iterator = iterator;
    if (size === 0) {
      this._promise._resolve(result);
    } else if (result === undefined) {
      this._callResolve(array[0], 0);
    } else {
      this._next(0, result);
    }
  }

  if ( AigleProxy ) ReduceArray.__proto__ = AigleProxy;
  ReduceArray.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  ReduceArray.prototype.constructor = ReduceArray;

  ReduceArray.prototype._next = function _next (index, result) {
    callProxyReciever(call3(this._iterator, result, this._array[index], index), this, index);
  };

  ReduceArray.prototype._callResolve = function _callResolve (result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._next(++index, result);
    }
  };

  ReduceArray.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return ReduceArray;
}(AigleProxy));

var ReduceObject = (function (AigleProxy) {
  function ReduceObject(object, iterator, result) {
    AigleProxy.call(this);
    var keys = Object.keys(object);
    var size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    if (size === 0) {
      this._promise._resolve(result);
    } else if (result === undefined) {
      this._callResolve(object[keys[0]], 0);
    } else {
      this._next(0, result);
    }
  }

  if ( AigleProxy ) ReduceObject.__proto__ = AigleProxy;
  ReduceObject.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  ReduceObject.prototype.constructor = ReduceObject;

  ReduceObject.prototype._next = function _next (index, result) {
    var key = this._keys[index];
    callProxyReciever(call3(this._iterator, result, this._object[key], key), this, index);
  };

  ReduceObject.prototype._callResolve = function _callResolve (result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._next(++index, result);
    }
  };

  ReduceObject.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return ReduceObject;
}(AigleProxy));

module.exports = reduce;

function reduce(collection, result, iterator) {
  if (iterator === undefined && typeof result === 'function') {
    iterator = result;
    result = undefined;
  }
  if (Array.isArray(collection)) {
    return new ReduceArray(collection, iterator, result)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new ReduceObject(collection, iterator, result)._promise;
  }
  return Aigle.resolve(result);
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],50:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/util');
var INTERNAL = ref$1.INTERNAL;
var compactArray = ref$1.compactArray;
var ref$2 = require('./internal/aigleEach');
var AigleEachArray = ref$2.AigleEachArray;
var AigleEachObject = ref$2.AigleEachObject;

var RejectArray = (function (AigleEachArray) {
  function RejectArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachArray ) RejectArray.__proto__ = AigleEachArray;
  RejectArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  RejectArray.prototype.constructor = RejectArray;

  RejectArray.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  };

  return RejectArray;
}(AigleEachArray));

var RejectObject = (function (AigleEachObject) {
  function RejectObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachObject ) RejectObject.__proto__ = AigleEachObject;
  RejectObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  RejectObject.prototype.constructor = RejectObject;

  RejectObject.prototype._callResolve = function _callResolve (value, index) {
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  };

  return RejectObject;
}(AigleEachObject));

module.exports = reject;

function reject(collection, iterator) {
  if (Array.isArray(collection)) {
    return new RejectArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new RejectObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleEach":26,"./internal/util":30}],51:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/util');
var INTERNAL = ref$1.INTERNAL;
var compactArray = ref$1.compactArray;
var ref$2 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
var AigleLimitArray = ref$2.AigleLimitArray;
var AigleLimitObject = ref$2.AigleLimitObject;

var RejectLimitArray = (function (AigleLimitArray) {
  function RejectLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitArray ) RejectLimitArray.__proto__ = AigleLimitArray;
  RejectLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  RejectLimitArray.prototype.constructor = RejectLimitArray;

  RejectLimitArray.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return RejectLimitArray;
}(AigleLimitArray));
var RejectLimitObject = (function (AigleLimitObject) {
  function RejectLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitObject ) RejectLimitObject.__proto__ = AigleLimitObject;
  RejectLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  RejectLimitObject.prototype.constructor = RejectLimitObject;

  RejectLimitObject.prototype._callResolve = function _callResolve (value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return RejectLimitObject;
}(AigleLimitObject));

module.exports = { rejectLimit: rejectLimit, RejectLimitArray: RejectLimitArray, RejectLimitObject: RejectLimitObject };

function rejectLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new RejectLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new RejectLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleLimit":27,"./internal/util":30}],52:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./rejectLimit');
var RejectLimitArray = ref$1.RejectLimitArray;
var RejectLimitObject = ref$1.RejectLimitObject;

module.exports = rejectSeries;

function rejectSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new RejectLimitArray(collection, iterator, 1)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new RejectLimitObject(collection, iterator, 1)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./rejectLimit":51}],53:[function(require,module,exports){
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
    this._next();
  }

  if ( AigleProxy ) Retry.__proto__ = AigleProxy;
  Retry.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  Retry.prototype.constructor = Retry;

  Retry.prototype._next = function _next () {
    callProxyReciever(call0(this._handler), this, undefined);
  };

  Retry.prototype._callResolve = function _callResolve (value) {
    this._promise._resolve(value);
  };

  Retry.prototype._callReject = function _callReject (reason) {
    if (--this._rest === 0) {
      this._promise._reject(reason);
    } else {
      this._next();
    }
  };

  return Retry;
}(AigleProxy));

module.exports = retry;

/**
 * @param {Integer} [times]
 * @param {Function} handler
 */
function retry(times, handler) {
  if (typeof times === 'function') {
    handler = times;
    times = DEFAULT_RETRY;
  }
  return new Retry(handler, times)._promise;
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],54:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;

var SomeArray = (function (AigleEachArray) {
  function SomeArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = false;
  }

  if ( AigleEachArray ) SomeArray.__proto__ = AigleEachArray;
  SomeArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  SomeArray.prototype.constructor = SomeArray;

  SomeArray.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  };

  return SomeArray;
}(AigleEachArray));

var SomeObject = (function (AigleEachObject) {
  function SomeObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = false;
  }

  if ( AigleEachObject ) SomeObject.__proto__ = AigleEachObject;
  SomeObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  SomeObject.prototype.constructor = SomeObject;

  SomeObject.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  };

  return SomeObject;
}(AigleEachObject));

module.exports = some;

function some(collection, iterator) {
  if (Array.isArray(collection)) {
    return new SomeArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SomeObject(collection, iterator)._iterate();
  }
  return Aigle.resolve(false);
}

},{"./aigle":2,"./internal/aigleEach":26}],55:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;

var SomeLimitArray = (function (AigleLimitArray) {
  function SomeLimitArray(array, iterator, limit) {
    AigleLimitArray.call(this, array, iterator, limit);
    this._result = false;
  }

  if ( AigleLimitArray ) SomeLimitArray.__proto__ = AigleLimitArray;
  SomeLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  SomeLimitArray.prototype.constructor = SomeLimitArray;

  SomeLimitArray.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return SomeLimitArray;
}(AigleLimitArray));
var SomeLimitObject = (function (AigleLimitObject) {
  function SomeLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = false;
  }

  if ( AigleLimitObject ) SomeLimitObject.__proto__ = AigleLimitObject;
  SomeLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  SomeLimitObject.prototype.constructor = SomeLimitObject;

  SomeLimitObject.prototype._callResolve = function _callResolve (value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return SomeLimitObject;
}(AigleLimitObject));

module.exports = someLimit;

function someLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new SomeLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SomeLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve(false);
}

},{"./aigle":2,"./internal/aigleLimit":27}],56:[function(require,module,exports){
'use strict';

var someLimit = require('./someLimit');

module.exports = someSeries;

function someSeries(collection, iterator) {
  return someLimit(collection, 1, iterator);
}

},{"./someLimit":55}],57:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleEach');
var AigleEachArray = ref$1.AigleEachArray;
var AigleEachObject = ref$1.AigleEachObject;
var ref$2 = require('./internal/util');
var sort = ref$2.sort;

var SortByArray = (function (AigleEachArray) {
  function SortByArray(array, iterator) {
    AigleEachArray.call(this, array, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachArray ) SortByArray.__proto__ = AigleEachArray;
  SortByArray.prototype = Object.create( AigleEachArray && AigleEachArray.prototype );
  SortByArray.prototype.constructor = SortByArray;

  SortByArray.prototype._callResolve = function _callResolve (criteria, index) {
    this._result[index] = { criteria: criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
  };

  return SortByArray;
}(AigleEachArray));

var SortByObject = (function (AigleEachObject) {
  function SortByObject(object, iterator) {
    AigleEachObject.call(this, object, iterator);
    this._result = Array(this._rest);
  }

  if ( AigleEachObject ) SortByObject.__proto__ = AigleEachObject;
  SortByObject.prototype = Object.create( AigleEachObject && AigleEachObject.prototype );
  SortByObject.prototype.constructor = SortByObject;

  SortByObject.prototype._callResolve = function _callResolve (criteria, index) {
    this._result[index] = { criteria: criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
  };

  return SortByObject;
}(AigleEachObject));

module.exports = sortBy;

function sortBy(collection, iterator) {
  if (Array.isArray(collection)) {
    return new SortByArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SortByObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleEach":26,"./internal/util":30}],58:[function(require,module,exports){
'use strict';

var ref = require('./aigle');
var Aigle = ref.Aigle;
var ref$1 = require('./internal/aigleLimit');
var DEFAULT_LIMIT = ref$1.DEFAULT_LIMIT;
var AigleLimitArray = ref$1.AigleLimitArray;
var AigleLimitObject = ref$1.AigleLimitObject;
var ref$2 = require('./internal/util');
var sort = ref$2.sort;

var SortByLimitArray = (function (AigleLimitArray) {
  function SortByLimitArray(object, iterator, limit) {
    AigleLimitArray.call(this, object, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitArray ) SortByLimitArray.__proto__ = AigleLimitArray;
  SortByLimitArray.prototype = Object.create( AigleLimitArray && AigleLimitArray.prototype );
  SortByLimitArray.prototype.constructor = SortByLimitArray;

  SortByLimitArray.prototype._callResolve = function _callResolve (criteria, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = { criteria: criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return SortByLimitArray;
}(AigleLimitArray));
var SortByLimitObject = (function (AigleLimitObject) {
  function SortByLimitObject(object, iterator, limit) {
    AigleLimitObject.call(this, object, iterator, limit);
    this._result = Array(this._rest);
  }

  if ( AigleLimitObject ) SortByLimitObject.__proto__ = AigleLimitObject;
  SortByLimitObject.prototype = Object.create( AigleLimitObject && AigleLimitObject.prototype );
  SortByLimitObject.prototype.constructor = SortByLimitObject;

  SortByLimitObject.prototype._callResolve = function _callResolve (criteria, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = { criteria: criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  };

  return SortByLimitObject;
}(AigleLimitObject));

module.exports = sortByLimit;

function sortByLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new SortByLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SortByLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}

},{"./aigle":2,"./internal/aigleLimit":27,"./internal/util":30}],59:[function(require,module,exports){
'use strict';

var sortByLimit = require('./sortByLimit');

module.exports = sortBySeries;

function sortBySeries(collection, iterator) {
  return sortByLimit(collection, 1, iterator);
}

},{"./sortByLimit":58}],60:[function(require,module,exports){
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

},{"./aigle":2,"./error":13,"./internal/util":30,"aigle-core":70}],61:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var callProxyReciever = ref$2.callProxyReciever;
var call1 = ref$2.call1;

var Times = (function (AigleProxy) {
  function Times(times, iterator) {
    AigleProxy.call(this);
    this._promise = new Aigle(INTERNAL);
    if (isNaN(times) || times < 1) {
      this._promise._resolve([]);
      return;
    }
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
 */
function times(times, iterator) {
  return new Times(+times, iterator)._promise;
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],62:[function(require,module,exports){
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
    if (isNaN(times) || times < 1 || isNaN(times) || limit < 1) {
      this._promise._resolve([]);
      return;
    }
    limit = limit > times ? times : limit;
    this._index = 0;
    this._rest = times;
    this._size = times;
    this._result = Array(times);
    this._iterator = iterator;
    while (limit--) {
      this$1._next();
    }
  }

  if ( AigleProxy ) TimesLimit.__proto__ = AigleProxy;
  TimesLimit.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  TimesLimit.prototype.constructor = TimesLimit;

  TimesLimit.prototype._next = function _next () {
    var i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  };

  TimesLimit.prototype._callResolve = function _callResolve (value, index) {

    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  TimesLimit.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return TimesLimit;
}(AigleProxy));

module.exports = timesLimit;

/**
 * @param {integer} times
 * @param {integer} [limit]
 * @param {Function} iterator
 */
function timesLimit(times, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  return new TimesLimit(+times, iterator, +limit)._promise;
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],63:[function(require,module,exports){
'use strict';

var timesLimit = require('./timesLimit');

module.exports = timesSeries;

/**
 * @param {integer} times
 * @param {Function} iterator
 */
function timesSeries(times, iterator) {
  return timesLimit(times, 1, iterator);
}

},{"./timesLimit":62}],64:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var clone = ref$2.clone;
var ref$3 = require('./internal/util');
var INTERNAL = ref$3.INTERNAL;
var call3 = ref$3.call3;
var callProxyReciever = ref$3.callProxyReciever;

var TransformArray = (function (AigleProxy) {
  function TransformArray(array, iterator, result) {
    AigleProxy.call(this);
    var size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    var i = -1;
    while (++i < size && callProxyReciever(call3(iterator, result, array[i], i), this, i)) {}
  }

  if ( AigleProxy ) TransformArray.__proto__ = AigleProxy;
  TransformArray.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  TransformArray.prototype.constructor = TransformArray;

  TransformArray.prototype._callResolve = function _callResolve (bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  TransformArray.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return TransformArray;
}(AigleProxy));

var TransformObject = (function (AigleProxy) {
  function TransformObject(object, iterator, result) {
    var this$1 = this;

    AigleProxy.call(this);
    var keys = Object.keys(object);
    var size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    var i = -1;
    while (++i < size) {
      var key = keys[i];
      if (callProxyReciever(call3(iterator, result, object[key], key), this$1, i) === false) {
        break;
      }
    }
  }

  if ( AigleProxy ) TransformObject.__proto__ = AigleProxy;
  TransformObject.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  TransformObject.prototype.constructor = TransformObject;

  TransformObject.prototype._callResolve = function _callResolve (bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  };

  TransformObject.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return TransformObject;
}(AigleProxy));

module.exports = transform;

/**
 * @param {Array|Object} collection
 * @param {Array|Object|Function} [accumulator]
 * @param {Function} iterator
 */
function transform(collection, accumulator, iterator) {
  if (Array.isArray(collection)) {
    if (iterator === undefined && typeof accumulator === 'function') {
      iterator = accumulator;
      accumulator = [];
    }
    return new TransformArray(collection, iterator, accumulator)._promise;
  }
  if (collection && typeof collection === 'object') {
    if (iterator === undefined && typeof accumulator === 'function') {
      iterator = accumulator;
      accumulator = {};
    }
    return new TransformObject(collection, iterator, accumulator)._promise;
  }
  return Aigle.resolve(arguments.length === 2 ? {} : accumulator);
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],65:[function(require,module,exports){
'use strict';

var ref = require('aigle-core');
var AigleProxy = ref.AigleProxy;
var ref$1 = require('./aigle');
var Aigle = ref$1.Aigle;
var ref$2 = require('./internal/util');
var INTERNAL = ref$2.INTERNAL;
var DEFAULT_LIMIT = ref$2.DEFAULT_LIMIT;
var call3 = ref$2.call3;
var callProxyReciever = ref$2.callProxyReciever;
var clone = ref$2.clone;

var TransformLimitArray = (function (AigleProxy) {
  function TransformLimitArray(array, iterator, result, limit) {
    var this$1 = this;

    AigleProxy.call(this);
    var size = array.length;
    this._promise = new Aigle(INTERNAL);
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._promise._resolve(result);
      return;
    }
    limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._iterator = iterator;
    this._result = result;
    while (limit--) {
      this$1._next();
    }
  }

  if ( AigleProxy ) TransformLimitArray.__proto__ = AigleProxy;
  TransformLimitArray.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  TransformLimitArray.prototype.constructor = TransformLimitArray;

  TransformLimitArray.prototype._next = function _next () {
    var i = this._index++;
    callProxyReciever(call3(this._iterator, this._result, this._array[i], i), this, i);
  };

  TransformLimitArray.prototype._callResolve = function _callResolve (bool) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  TransformLimitArray.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return TransformLimitArray;
}(AigleProxy));

var TransformLimitObject = (function (AigleProxy) {
  function TransformLimitObject(object, iterator, result, limit) {
    var this$1 = this;

    AigleProxy.call(this);
    var keys = Object.keys(object);
    var size = keys.length;
    this._promise = new Aigle(INTERNAL);
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._promise._resolve(result);
      return;
    }
    limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    this._result = result;
    while (limit--) {
      this$1._next();
    }
  }

  if ( AigleProxy ) TransformLimitObject.__proto__ = AigleProxy;
  TransformLimitObject.prototype = Object.create( AigleProxy && AigleProxy.prototype );
  TransformLimitObject.prototype.constructor = TransformLimitObject;

  TransformLimitObject.prototype._next = function _next () {
    var i = this._index++;
    var key = this._keys[i];
    callProxyReciever(call3(this._iterator, this._result, this._object[key], key), this, i);
  };

  TransformLimitObject.prototype._callResolve = function _callResolve (bool) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  };

  TransformLimitObject.prototype._callReject = function _callReject (reason) {
    this._promise._reject(reason);
  };

  return TransformLimitObject;
}(AigleProxy));

module.exports = transformLimit;

/**
 * @param {Array|Object} collection
 * @param {integer} [limit]
 * @param {Array|Object} [accumulator]
 * @param {Function} iterator
 */
function transformLimit(collection, limit, accumulator, iterator) {
  if (iterator === undefined) {
    if (typeof accumulator === 'function') {
      iterator = accumulator;
      accumulator = undefined;
    } else if (typeof limit === 'function') {
      iterator = limit;
      accumulator = undefined;
      limit = undefined;
    }
  }
  var isArray = Array.isArray(collection);
  if (typeof limit === 'object' && accumulator === undefined) {
    accumulator = limit;
    limit = DEFAULT_LIMIT;
  } else if (limit === undefined) {
    limit = DEFAULT_LIMIT;
  }
  if (accumulator === undefined) {
    accumulator = isArray ? [] : {};
  }
  if (isArray) {
    return new TransformLimitArray(collection, iterator, accumulator, limit)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new TransformLimitObject(collection, iterator, accumulator, limit)._promise;
  }
  return Aigle.resolve(accumulator);
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],66:[function(require,module,exports){
'use strict';

var transformLimit = require('./transformLimit');

module.exports = transformSeries;

/**
 * @param {Array|Object} collection
 * @param {Array|Object} [accumulator]
 * @param {Function} iterator
 */
function transformSeries(collection, accumulator, iterator) {
  return transformLimit(collection, 1, accumulator, iterator);
}

},{"./transformLimit":65}],67:[function(require,module,exports){
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

},{"./whilst":69}],68:[function(require,module,exports){
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
  return call1(this._handler, this._promise._value);
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

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],69:[function(require,module,exports){
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

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],70:[function(require,module,exports){
'use strict';

var AigleCore = function AigleCore() {};

var AigleProxy = function AigleProxy() {};

module.exports = { AigleCore: AigleCore, AigleProxy: AigleProxy };

},{}],71:[function(require,module,exports){
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

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],72:[function(require,module,exports){
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
},{"_process":71}],73:[function(require,module,exports){
module.exports={
  "name": "aigle",
  "version": "0.4.4",
  "description": "Aigle is an ideal Promise library, faster and more functional than other Promise libraries",
  "main": "index.js",
  "browser": "browser.js",
  "scripts": {
    "test": "DELAY=50 istanbul cover ./node_modules/.bin/_mocha --report lcovonly -- -R spec ./test --recursive && codecov",
    "build": "node build"
  },
  "keywords": [
    "aigle",
    "promise",
    "async"
  ],
  "author": "Suguru Motegi",
  "license": "MIT",
  "devDependencies": {
    "babili": "0.0.11",
    "benchmark": "^2.1.1",
    "bluebird": "^3.4.6",
    "browserify": "^14.1.0",
    "buble": "^0.15.2",
    "codecov": "^1.0.1",
    "istanbul": "^0.4.5",
    "lodash": "^4.15.0",
    "minimist": "^1.2.0",
    "mocha": "^2.5.3",
    "mocha.parallel": "^0.12.0",
    "neo-async": "^2.0.1",
    "setimmediate": "^1.0.5",
    "uglify-js": "^2.7.5"
  },
  "dependencies": {
    "aigle-core": "^0.2.0"
  }
}

},{}]},{},[1])(1)
});
