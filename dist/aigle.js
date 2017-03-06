(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Promise = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('setimmediate');
module.exports = require('./lib/aigle');

},{"./lib/aigle":2,"setimmediate":72}],2:[function(require,module,exports){
(function (process){
'use strict';

const { AigleCore, AigleProxy } = require('aigle-core');
const Queue = require('./internal/queue');
const Task = require('./internal/task');
const {
  VERSION,
  INTERNAL,
  errorObj,
  call0,
  call1,
  callThen
} = require('./internal/util');
const queue = new Queue();

class Aigle extends AigleCore {

  /**
   * @param {Function} executor
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
    execute(this, executor);
  }

  /**
   * @return {string}
   */
  toString() {
    return '[object Promise]';
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
      const errorTypes = Array(l);
      while (l--) {
        errorTypes[l] = arguments[l];
      }
      onRejected = createOnRejected(errorTypes, onRejected);
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
   * @param {Function} handler
   * @example
   * const array = [1, 2, 3];
   * Aigle.resolve(array)
   *   .spread((arg1, arg2, arg3) => {
   *     console.log(arg1, arg2, arg3); // 1, 2, 3
   *   });
   *
   * @example
   * const object = { a: 1, b: 2, c: 3 };
   * Aigle.resolve(object)
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
   * @return {Aigle} Returns an Aigle instance
   * @example
   * Aigle.resolve([
   *   new Aigle(resolve => setTimeout(() => resolve(1), 30)),
   *   new Aigle(resolve => setTimeout(() => resolve(2), 20)),
   *   new Aigle(resolve => setTimeout(() => resolve(3), 10))
   * ])
   * .all()
   * .then(value => console.log(value)); // [1, 2, 3]
   */
  all() {
    return this.then(all);
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
    return this.then(race);
  }

  /**
   * @return {Aigle} Returns an Aigle instance
   * @example
   * Aigle.resolve({
   *   a: new Aigle(resolve => setTimeout(() => resolve(1), 30)),
   *   b: new Aigle(resolve => setTimeout(() => resolve(2), 20)),
   *   c: new Aigle(resolve => setTimeout(() => resolve(3), 10)),
   *   d: 4
   * })
   * .props()
   * .then(value => console.log(value)); // { a: 1, b: 2, c: 3, d: 4 }
   */
  props() {
    return this.then(props);
  }

  parallel() {
    return this.then(parallel);
  }

  /**
   * @param {Function} iterator
   */
  each(iterator) {
    return this.then(value => each(value, iterator));
  }

  /**
   * @alias each
   * @param {Function} iterator
   */
  forEach(iterator) {
    return this.each(iterator);
  }

  /**
   * @param {Function} iterator
   */
  eachSeries(iterator) {
    return this.then(value => eachSeries(value, iterator));
  }

  /**
   * @alias eachSeries
   * @param {Function} iterator
   */
  forEachSeries(iterator) {
    return this.eachSeries(iterator);
  }

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
  eachLimit(limit, iterator) {
    return this.then(value => eachLimit(value, limit, iterator));
  }

  /**
   * @alias eachLimit
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  forEachLimit(limit, iterator) {
    return this.eachLimit(limit, iterator);
  }

  /**
   * @param {Function} iterator
   */
  map(iterator) {
    return this.then(value => map(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  mapSeries(iterator) {
    return this.then(value => mapSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  mapLimit(limit, iterator) {
    return this.then(value => mapLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  mapValues(iterator) {
    return this.then(value => mapValues(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  mapValuesSeries(iterator) {
    return this.then(value => mapValuesSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  mapValuesLimit(limit, iterator) {
    return this.then(value => mapValuesLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  filter(iterator) {
    return this.then(value => filter(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  filterSeries(iterator) {
    return this.then(value => filterSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  filterLimit(limit, iterator) {
    return this.then(value => filterLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  reject(iterator) {
    return this.then(value => reject(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  rejectSeries(iterator) {
    return this.then(value => rejectSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  rejectLimit(limit, iterator) {
    return this.then(value => rejectLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  find(iterator) {
    return this.then(value => find(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  findSeries(iterator) {
    return this.then(value => findSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  findLimit(limit, iterator) {
    return this.then(value => findLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  pick(iterator) {
    return this.then(value => pick(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  pickSeries(iterator) {
    return this.then(value => pickSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  pickLimit(limit, iterator) {
    return this.then(value => pickLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  omit(iterator) {
    return this.then(value => omit(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  omitSeries(iterator) {
    return this.then(value => omitSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  omitLimit(limit, iterator) {
    return this.then(value => omitLimit(value, limit, iterator));
  }

  /**
   * @param {*} result
   * @param {Function} iterator
   */
  reduce(result, iterator) {
    return this.then(value => reduce(value, result, iterator));
  }

  /**
   * @param {Array|Object} result
   * @param {Function} iterator
   */
  transform(result, iterator) {
    return this.then(value => transform(value, result, iterator));
  }

  /**
   * @param {Array|Object} result
   * @param {Function} iterator
   */
  transformSeries(result, iterator) {
    return this.then(value => transformSeries(value, result, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Array|Object} result
   * @param {Function} iterator
   */
  transformLimit(limit, result, iterator) {
    return this.then(value => transformLimit(value, limit, result, iterator));
  }

  /**
   * @param {Function} iterator
   */
  sortBy(iterator) {
    return this.then(value => sortBy(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  sortBySeries(iterator) {
    return this.then(value => sortBySeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  sortByLimit(limit, iterator) {
    return this.then(value => sortByLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  some(iterator) {
    return this.then(value => some(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  someSeries(iterator) {
    return this.then(value => someSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  someLimit(limit, iterator) {
    return this.then(value => someLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  every(iterator) {
    return this.then(value => every(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  everySeries(iterator) {
    return this.then(value => everySeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  everyLimit(limit, iterator) {
    return this.then(value => everyLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  concat(iterator) {
    return this.then(value => concat(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  concatSeries(iterator) {
    return this.then(value => concatSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  concatLimit(limit, iterator) {
    return this.then(value => concatLimit(value, limit, iterator));
  }

  /**
   * @param {Function} iterator
   */
  groupBy(iterator) {
    return this.then(value => groupBy(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  groupBySeries(iterator) {
    return this.then(value => groupBySeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  groupByLimit(limit, iterator) {
    return this.then(value => groupByLimit(value, limit, iterator));
  }

  /**
   * @param {number} ms
   */
  delay(ms) {
    return addReceiver(this, new Delay(ms));
  }

  /**
   * @param {number} ms
   * @param {*} [message]
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
   */
  doUntil(iterator, tester) {
    return this.then(value => doUntil(value, iterator, tester));
  }

  /**
   * @param {Function} iterator
   */
  times(iterator) {
    return this.then(value => times(value, iterator));
  }

  /**
   * @param {Function} iterator
   */
  timesSeries(iterator) {
    return this.then(value => timesSeries(value, iterator));
  }

  /**
   * @param {number} [limit=8]
   * @param {Function} iterator
   */
  timesLimit(limit, iterator) {
    return this.then(value => timesLimit(value, limit, iterator));
  }

  /**
   * @param {Function} handler
   */
  disposer(handler) {
    return new Disposer(this, handler);
  }

  /* internal functions */

  _resolve(value) {
    this._resolved = 1;
    this._value = value;
    if (this._receiver === undefined) {
      return;
    }
    const { _receiver } = this;
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
    const { _receivers } = this;
    this._receivers = undefined;
    while (_receivers.head) {
      const { receiver, onFulfilled } = _receivers.shift();
      callResolve(receiver, onFulfilled, value);
    }
  }

  _reject(reason) {
    this._resolved = 2;
    this._value = reason;
    if (this._receiver === undefined) {
      process.emit('unhandledRejection', reason);
      return;
    }
    const { _receiver, _key } = this;
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
    const { _receivers } = this;
    this._receivers = undefined;
    while (_receivers.head) {
      const { receiver, onRejected } = _receivers.shift();
      callReject(receiver, onRejected, reason);
    }
  }

  _addAigle(receiver, onFulfilled, onRejected) {
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
  }

  _addReceiver(receiver, key) {
    this._key = key;
    this._receiver = receiver;
  }
}

module.exports = { Aigle };

/* functions, classes */
const { all } = require('./all');
const race = require('./race');
const { props } = require('./props');
const parallel = require('./parallel');
const each = require('./each');
const eachSeries = require('./eachSeries');
const eachLimit = require('./eachLimit');
const map = require('./map');
const mapSeries = require('./mapSeries');
const { mapLimit } = require('./mapLimit');
const mapValues = require('./mapValues');
const mapValuesSeries = require('./mapValuesSeries');
const { mapValuesLimit } = require('./mapValuesLimit');
const filter = require('./filter');
const filterSeries = require('./filterSeries');
const { filterLimit } = require('./filterLimit');
const reject = require('./reject');
const rejectSeries = require('./rejectSeries');
const { rejectLimit } = require('./rejectLimit');
const find = require('./find');
const findSeries = require('./findSeries');
const { findLimit } = require('./findLimit');
const pick = require('./pick');
const pickSeries = require('./pickSeries');
const { pickLimit } = require('./pickLimit');
const omit = require('./omit');
const omitSeries = require('./omitSeries');
const { omitLimit } = require('./omitLimit');
const reduce = require('./reduce');
const transform = require('./transform');
const transformSeries = require('./transformSeries');
const transformLimit = require('./transformLimit');
const sortBy = require('./sortBy');
const sortBySeries = require('./sortBySeries');
const sortByLimit = require('./sortByLimit');
const some = require('./some');
const someSeries = require('./someSeries');
const someLimit = require('./someLimit');
const every = require('./every');
const everySeries = require('./everySeries');
const everyLimit = require('./everyLimit');
const concat = require('./concat');
const concatSeries = require('./concatSeries');
const concatLimit = require('./concatLimit');
const groupBy = require('./groupBy');
const groupBySeries = require('./groupBySeries');
const groupByLimit = require('./groupByLimit');
const { join, Spread } = require('./join');
const { delay, Delay } = require('./delay');
const Timeout = require('./timeout');
const { whilst } = require('./whilst');
const { doWhilst } = require('./doWhilst');
const { until } = require('./until');
const doUntil = require('./doUntil');
const retry = require('./retry');
const times = require('./times');
const timesSeries = require('./timesSeries');
const timesLimit = require('./timesLimit');
const { using, Disposer } = require('./using');

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
const { TimeoutError } = require('./error');
Aigle.TimeoutError = TimeoutError;

function _resolve(value) {
  const promise = new Aigle(INTERNAL);
  promise._resolved = 1;
  promise._value = value;
  return promise;
}

function _reject(reason, iterator) {
  if (arguments.length === 2 && typeof iterator === 'function') {
    return reject(reason, iterator);
  }
  const promise = new Aigle(INTERNAL);
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
  const promise = call1(onFulfilled, value);
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
  const promise = call1(onRejected, reason);
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
  return reason => {
    let l = errorTypes.length;
    while (l--) {
      if (reason instanceof errorTypes[l]) {
        return onRejected(reason);
      }
    }
    return Aigle.reject(reason);
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

function tick() {
  while (queue.head) {
    const task = queue.shift();
    const { promise, receiver } = task;
    const { _resolved, _value } = promise;
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

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, promiseArrayEach } = require('./internal/util');

class AigleAll extends AigleProxy {

  constructor(array) {
    super();
    const size = array.length;
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

module.exports = { all, AigleAll };

function all(array) {
  return new AigleAll(array)._promise;
}


},{"./aigle":2,"./internal/util":30,"aigle-core":70}],4:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class ConcatArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = [];
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class ConcatObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = [];
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class ConcatLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = [];
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class ConcatLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = [];
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

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

const concatLimit = require('./concatLimit');

module.exports = concatSeries;

function concatSeries(collection, iterator) {
  return concatLimit(collection, 1, iterator);
}

},{"./concatLimit":5}],7:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL } = require('./internal/util');

class Delay extends AigleProxy {

  constructor(ms) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._ms = ms;
  }

  _callResolve(value) {
    setTimeout(() => this._promise._resolve(value), this._ms);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { delay, Delay };

function delay(ms, value) {
  const delay = new Delay(ms);
  delay._callResolve(value);
  return delay._promise;
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],8:[function(require,module,exports){
'use strict';

const { DoWhilst } = require('./doWhilst');
const { UntilTester } = require('./until');

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

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

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

const { Aigle } = require('./aigle');
const { AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

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

const types = ['TimeoutError'];
let l = types.length;
while (l--) {
  exports[types[l]] = class extends Error {
    constructor(message) {
      super(message);
    }
  };
}

},{}],14:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class EveryArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = true;
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    }
  }
}

class EveryObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = true;
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class EveryLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = true;
  }

  _callResolve(value) {
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
  }
}
class EveryLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = true;
  }

  _callResolve(value) {
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
  }
}

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

const everyLimit = require('./everyLimit');

module.exports = everySeries;

function everySeries(collection, iterator) {
  return everyLimit(collection, 1, iterator);
}

},{"./everyLimit":15}],17:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class FilterArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

class FilterObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

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

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class FilterLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class FilterLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { filterLimit, FilterLimitArray, FilterLimitObject };

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

const { Aigle } = require('./aigle');
const { FilterLimitArray, FilterLimitObject } = require('./filterLimit');

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

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class FindArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }
}

class FindObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class FindLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
  }

  _callResolve(value, index) {
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
  }
}
class FindLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
  }

  _callResolve(value, index) {
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
  }
}

module.exports = { findLimit, FindLimitArray, FindLimitObject };

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

const { Aigle } = require('./aigle');
const { FindLimitArray, FindLimitObject } = require('./findLimit');

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

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class GroupByArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = {};
  }

  _callResolve(key, index) {
    if (this._result[key]) {
      this._result[key].push(this._array[index]);
    } else {
      this._result[key] = [this._array[index]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class GroupByObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = {};
  }

  _callResolve(key, index) {
    if (this._result[key]) {
      this._result[key].push(this._object[this._keys[index]]);
    } else {
      this._result[key] = [this._object[this._keys[index]]];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class GroupByLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = {};
  }

  _callResolve(key, index) {
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
  }
}
class GroupByLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = {};
  }

  _callResolve(key, index) {
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
  }
}

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

const groupByLimit = require('./groupByLimit');

module.exports = groupBySeries;

function groupBySeries(collection, iterator) {
  return groupByLimit(collection, 1, iterator);
}

},{"./groupByLimit":24}],26:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('../aigle');
const { INTERNAL, call2, callProxyReciever } = require('./util');

class AigleEachArray extends AigleProxy {

  constructor(array, iterator) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _array } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (++i < _rest && callProxyReciever(call2(_iterator, _array[i], i), this, i)) {}
    }
    return this._promise;
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 & this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class AigleEachObject extends AigleProxy {

  constructor(object, iterator) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _keys, _object } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
    } else {
      while (++i < _rest) {
        const key = _keys[i];
        if (callProxyReciever(call2(_iterator, _object[key], key), this, i) === false) {
          break;
        }
      }
    }
    return this._promise;
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 & this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { AigleEachArray, AigleEachObject };

},{"../aigle":2,"./util":30,"aigle-core":70}],27:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('../aigle');
const { INTERNAL, DEFAULT_LIMIT, call2, callProxyReciever } = require('./util');

class AigleLimitArray extends AigleProxy {

  constructor(array, iterator, limit) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._result = undefined;
    this._iterator = iterator;
  }

  _iterate() {
    if (this._limit >= 1) {
      while (this._limit--) {
        this._next();
      }
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call2(this._iterator, this._array[i], i), this, i);
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 && this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._promise._resolved === 0 && this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class AigleLimitObject extends AigleProxy {

  constructor(object, iterator, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
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

  _iterate() {
    if (this._limit >= 1) {
      while (this._limit--) {
        this._next();
      }
    } else {
      this._promise._resolve(this._result);
    }
    return this._promise;
  }

  _next() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call2(this._iterator, this._object[key], key), this, i);
  }

  _callResolve(value) {
    if (value === false) {
      this._promise._resolved === 0 && this._promise._resolve();
    } else if (--this._rest === 0) {
      this._promise._resolve();
    } else if (this._index < this._size) {
      this._promise._resolved === 0 && this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject };

},{"../aigle":2,"./util":30,"aigle-core":70}],28:[function(require,module,exports){
'use strict';

class Queue {

  constructor() {
    this.tail = undefined;
    this.head = undefined;
  }

  push(task) {
    const tail = this.tail;
    this.tail = task;
    if (tail) {
      tail.tail = task;
    } else {
      this.head = task;
    }
  }

  shift() {
    const head = this.head;
    this.head = head.tail;
    if (!this.head) {
      this.tail = null;
    }
    return head;
  }
}

module.exports = Queue;

},{}],29:[function(require,module,exports){
'use strict';

class Task {

  constructor(promise, receiver, onFulfilled, onRejected) {
    this.promise = promise;
    this.receiver = receiver;
    this.onFulfilled = onFulfilled;
    this.onRejected = onRejected;
    this.head = undefined;
    this.tail = undefined;
  }
}

module.exports = Task;

},{}],30:[function(require,module,exports){
'use strict';

const { AigleCore } = require('aigle-core');
const { version: VERSION } = require('../../package.json');
const DEFAULT_LIMIT = 8;
const errorObj = { e: undefined };

module.exports = {
  VERSION,
  DEFAULT_LIMIT,
  INTERNAL,
  errorObj,
  call0,
  call1,
  call2,
  call3,
  callThen,
  callProxyReciever,
  apply,
  promiseArrayEach,
  promiseObjectEach,
  compactArray,
  clone,
  sort
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
  const { _array, _rest } = receiver;
  let i = -1;
  while (++i < _rest) {
    const promise = _array[i];
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
  const { _keys, _object, _rest } = receiver;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    const promise = _object[key];
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


function sortIterator(a, b) {
  return a.criteria - b.criteria;
}

function sort(array) {
  array.sort(sortIterator);
  let l = array.length;
  while (l--) {
    array[l] = array[l].value;
  }
  return array;
}

},{"../../package.json":73,"aigle-core":70}],31:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const {
  INTERNAL,
  call1,
  apply,
  callProxyReciever
} = require('./internal/util');

const SPREAD = {};

class Join extends AigleProxy {

  constructor(handler, size) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = Array(size);
    this._handler = handler;
  }

  _callResolve(value, index) {
    if (index === SPREAD) {
      return this._promise._resolve(value);
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      spread(this, this._result);
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
    if (index === SPREAD) {
      return this._promise._resolve(value);
    }
    spread(this, value);
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { join, Spread };

function join() {
  let l = arguments.length;
  const handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const receiver = new Join(handler, l);
  while (l--) {
    callProxyReciever(arguments[l], receiver, l);
  }
  return receiver._promise;
}

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
    return callProxyReciever(call1(_handler, array), proxy, SPREAD);
  }
  callProxyReciever(apply(_handler, array), proxy, SPREAD);
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],32:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class MapArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class MapObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class MapLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class MapLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { mapLimit, MapLimitArray, MapLimitObject };

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

const { Aigle } = require('./aigle');
const { MapLimitArray, MapLimitObject } = require('./mapLimit');

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

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class MapValuesArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class MapValuesObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    this._result[this._keys[index]] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class MapValuesLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class MapValuesLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[this._keys[index]] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { mapValuesLimit, MapValuesLimitArray, MapValuesLimitObject };

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

const { Aigle } = require('./aigle');
const { MapValuesLimitArray, MapValuesLimitObject } = require('./mapValuesLimit');

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

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class OmitArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (!value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class OmitObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (!value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class OmitLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
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
  }
}
class OmitLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (!value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { omitLimit, OmitLimitArray, OmitLimitObject };

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

const { Aigle } = require('./aigle');
const { OmitLimitArray, OmitLimitObject } = require('./omitLimit');

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

const { Aigle } = require('./aigle');
const { AigleAll } = require('./all');
const { AigleProps } = require('./props');

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

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class PickArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class PickObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class PickLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
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
  }
}
class PickLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { pickLimit, PickLimitArray, PickLimitObject };

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

const { Aigle } = require('./aigle');
const { PickLimitArray, PickLimitObject } = require('./pickLimit');

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

const { Aigle } = require('./aigle');
const { INTERNAL } = require('./internal/util');

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

function makeCallback(promise) {
  return (err, res) => {
    if (err) {
      promise._reject(err);
    } else {
      promise._resolve(res);
    }
  };
}

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

function makeFunction(fn, ctx) {

  promisified.__isPromisified__ = true;
  return promisified;

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

},{"./aigle":2,"./internal/util":30}],46:[function(require,module,exports){
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
  __isPromisified__: true
};

module.exports = promisifyAll;

/**
 * @param {Object} target
 * @param {Object} [opts]
 * @param {String} [opts.suffix=Async]
 * @param {Function} [opts.filter]
 * @param {Function} [opts.depth=2]
 */
function promisifyAll(target, opts) {
  const { suffix = 'Async', filter = defaultFilter, depth = 2 } = opts || {};
  _promisifyAll(suffix, filter, target, undefined, undefined, depth);
  return target;
}

function defaultFilter(name) {
  return /^_/.test(name);
}

function _promisifyAll(suffix, filter, obj, key, target, depth) {
  const memo = {};
  switch (typeof obj) {
  case 'function':
    if (target) {
      const _key = `${key}${suffix}`;
      if (target[_key]) {
        if (!target[_key].__isPromisified__) {
          throw new TypeError(`Cannot promisify an API that has normal methods with '${suffix}'-suffix`);
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
    if (skipMap[key] === true || memo[key] === true || filter(key)) {
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

},{"./promisify":45}],47:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, promiseObjectEach } = require('./internal/util');

class AigleProps extends AigleProxy {

  constructor(object) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
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

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { props, AigleProps };

function props(object) {
  return new AigleProps(object)._promise;
}

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],48:[function(require,module,exports){
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
    this._array = array;
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
    this._object = object;
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

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, call3, callProxyReciever } = require('./internal/util');

class ReduceArray extends AigleProxy {

  constructor(array, iterator, result) {
    super();
    const size = array.length;
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

  _next(index, result) {
    callProxyReciever(call3(this._iterator, result, this._array[index], index), this, index);
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._next(++index, result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class ReduceObject extends AigleProxy {

  constructor(object, iterator, result) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
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

  _next(index, result) {
    const key = this._keys[index];
    callProxyReciever(call3(this._iterator, result, this._object[key], key), this, index);
  }

  _callResolve(result, index) {
    if (--this._rest === 0) {
      this._promise._resolve(result);
    } else {
      this._next(++index, result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

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

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class RejectArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

class RejectObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

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

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class RejectLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class RejectLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { rejectLimit, RejectLimitArray, RejectLimitObject };

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

const { Aigle } = require('./aigle');
const { RejectLimitArray, RejectLimitObject } = require('./rejectLimit');

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

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, call0, callProxyReciever } = require('./internal/util');
const DEFAULT_RETRY = 5;

class Retry extends AigleProxy {

  constructor(handler, times) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._rest = times;
    this._handler = handler;
    this._next();
  }

  _next() {
    callProxyReciever(call0(this._handler), this, undefined);
  }

  _callResolve(value) {
    this._promise._resolve(value);
  }

  _callReject(reason) {
    if (--this._rest === 0) {
      this._promise._reject(reason);
    } else {
      this._next();
    }
  }

}

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

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class SomeArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = false;
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  }
}

class SomeObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = false;
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class SomeLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = false;
  }

  _callResolve(value) {
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
  }
}
class SomeLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = false;
  }

  _callResolve(value) {
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
  }
}

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

const someLimit = require('./someLimit');

module.exports = someSeries;

function someSeries(collection, iterator) {
  return someLimit(collection, 1, iterator);
}

},{"./someLimit":55}],57:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');
const { sort } = require('./internal/util');

class SortByArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
  }
}

class SortByObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
  }
}

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

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');
const { sort } = require('./internal/util');

class SortByLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = { criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class SortByLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = { criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

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

const sortByLimit = require('./sortByLimit');

module.exports = sortBySeries;

function sortBySeries(collection, iterator) {
  return sortByLimit(collection, 1, iterator);
}

},{"./sortByLimit":58}],60:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { TimeoutError } = require('./error');
const { INTERNAL } = require('./internal/util');

class Timeout extends AigleProxy {

  constructor(ms, message) {
    super();
    this._promise = new Aigle(INTERNAL);
    this._message = message;
    this._timer = setTimeout(() => {
      if (message) {
        this._callReject(message);
      } else {
        this._callReject(new TimeoutError('operation timed out'));
      }
    }, ms);
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

},{"./aigle":2,"./error":13,"./internal/util":30,"aigle-core":70}],61:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, callProxyReciever, call1 } = require('./internal/util');

class Times extends AigleProxy {

  constructor(times, iterator) {
    super();
    this._promise = new Aigle(INTERNAL);
    if (isNaN(times) || times < 1) {
      this._promise._resolve([]);
      return;
    }
    this._rest = times;
    this._result = Array(times);
    this._iterator = iterator;
    let i = -1;
    while (++i < times && callProxyReciever(call1(this._iterator, i), this, i)) {}
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

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, DEFAULT_LIMIT, callProxyReciever, call1 } = require('./internal/util');

class TimesLimit extends AigleProxy {

  constructor(times, iterator, limit) {
    super();
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
      this._next();
    }
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call1(this._iterator, i), this, i);
  }

  _callResolve(value, index) {

    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

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

const timesLimit = require('./timesLimit');

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

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { clone } = require('./internal/util');
const { INTERNAL, call3, callProxyReciever } = require('./internal/util');

class TransformArray extends AigleProxy {

  constructor(array, iterator, result) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    let i = -1;
    while (++i < size && callProxyReciever(call3(iterator, result, array[i], i), this, i)) {}
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class TransformObject extends AigleProxy {

  constructor(object, iterator, result) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    let i = -1;
    while (++i < size) {
      const key = keys[i];
      if (callProxyReciever(call3(iterator, result, object[key], key), this, i) === false) {
        break;
      }
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

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

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { INTERNAL, DEFAULT_LIMIT, call3, callProxyReciever, clone } = require('./internal/util');

class TransformLimitArray extends AigleProxy {

  constructor(array, iterator, result, limit) {
    super();
    const size = array.length;
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
      this._next();
    }
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call3(this._iterator, this._result, this._array[i], i), this, i);
  }

  _callResolve(bool) {
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
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class TransformLimitObject extends AigleProxy {

  constructor(object, iterator, result, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
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
      this._next();
    }
  }

  _next() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call3(this._iterator, this._result, this._object[key], key), this, i);
  }

  _callResolve(bool) {
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
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

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
  const isArray = Array.isArray(collection);
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

const transformLimit = require('./transformLimit');

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

},{"./whilst":69}],68:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const {
  INTERNAL,
  apply,
  call1,
  callProxyReciever
} = require('./internal/util');

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

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],69:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
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

},{"./aigle":2,"./internal/util":30,"aigle-core":70}],70:[function(require,module,exports){
'use strict';

class AigleCore {
  constructor() {}
}

class AigleProxy {
  constructor() {}
}

module.exports = { AigleCore, AigleProxy };

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
},{"_process":71}],73:[function(require,module,exports){
module.exports={
  "name": "aigle",
  "version": "0.4.6",
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
  "author": "Suguru Motegi",
  "license": "MIT",
  "devDependencies": {
    "babili": "0.0.11",
    "benchmark": "^2.1.1",
    "bluebird": "^3.4.6",
    "browserify": "^14.1.0",
    "buble": "^0.15.2",
    "codecov": "^1.0.1",
    "docdash": "^0.4.0",
    "gulp": "^3.9.1",
    "gulp-bump": "^2.7.0",
    "gulp-git": "^2.0.0",
    "gulp-tag-version": "^1.3.0",
    "istanbul": "^0.4.5",
    "jsdoc": "^3.4.3",
    "lodash": "^4.15.0",
    "minimist": "^1.2.0",
    "mocha": "^2.5.3",
    "mocha.parallel": "^0.12.0",
    "neo-async": "^2.0.1",
    "require-dir": "^0.3.1",
    "run-sequence": "^1.2.2",
    "setimmediate": "^1.0.5",
    "uglify-js": "^2.7.5"
  },
  "dependencies": {
    "aigle-core": "^0.2.0"
  }
}

},{}]},{},[1])(1)
});