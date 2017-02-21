'use strict';

const AigleCore = require('aigle-core');
const Queue = require('./internal/queue');
const Task = require('./internal/task');
const {
  VERSION,
  INTERNAL,
  errorObj,
  call1,
  makeResolve,
  makeReject
} = require('./internal/util');
const queue = new Queue();

class Aigle extends AigleCore {

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

  toString() {
    return '[object Promise]';
  }

  then(onFulfilled, onRejected) {
    const promise = new Aigle(INTERNAL);
    if (this._resolved === 0) {
      this._addAigle(promise, onFulfilled, onRejected);
    } else {
      push(this, promise, onFulfilled, onRejected);
    }
    return promise;
  }

  catch(onRejected) {
    const promise = new Aigle(INTERNAL);
    if (arguments.length > 1) {
      let l = arguments.length;
      onRejected = arguments[--l];
      const errorTypes = Array(l);
      while (l--) {
        errorTypes[l] = arguments[l];
      }
      onRejected = createOnRejected(promise, errorTypes, onRejected);
    }
    if (this._resolved === 0) {
      this._addAigle(promise, undefined, onRejected);
    } else {
      push(this, promise, undefined, onRejected);
    }
    return promise;
  }

  finally(handler) {
    const promise = new Aigle(INTERNAL);
    handler = typeof handler !== 'function' ? handler : createFinallyHandler(this, handler);
    if (this._resolved === 0) {
      this._addAigle(promise, handler, handler);
    } else {
      push(this, promise, handler, handler);
    }
    return promise;
  }

  spread(handler) {
    const promise = new Spread(handler);
    this._key = INTERNAL;
    this._resolved === 0 ? this._addReceiver(promise) : push(this, promise);
    return promise;
  }

  all() {
    return this.then(all);
  }

  race() {
    return this.then(race);
  }

  props() {
    return this.then(props);
  }

  parallel() {
    return this.then(parallel);
  }

  each(iterator) {
    return this.then(value => each(value, iterator));
  }

  forEach(iterator) {
    return this.each(iterator);
  }

  eachSeries(iterator) {
    return this.then(value => eachSeries(value, iterator));
  }

  forEachSeries(iterator) {
    return this.eachSeries(iterator);
  }

  eachLimit(limit, iterator) {
    return this.then(value => eachLimit(value, limit, iterator));
  }

  forEachLimit(limit, iterator) {
    return this.eachLimit(limit, iterator);
  }

  map(iterator) {
    return this.then(value => map(value, iterator));
  }

  mapSeries(iterator) {
    return this.then(value => mapSeries(value, iterator));
  }

  mapLimit(limit, iterator) {
    return this.then(value => mapLimit(value, limit, iterator));
  }

  mapValues(iterator) {
    return this.then(value => mapValues(value, iterator));
  }

  mapValuesSeries(iterator) {
    return this.then(value => mapValuesSeries(value, iterator));
  }

  mapValuesLimit(limit, iterator) {
    return this.then(value => mapValuesLimit(value, limit, iterator));
  }

  filter(iterator) {
    return this.then(value => filter(value, iterator));
  }

  filterSeries(iterator) {
    return this.then(value => filterSeries(value, iterator));
  }

  filterLimit(limit, iterator) {
    return this.then(value => filterLimit(value, limit, iterator));
  }

  reject(iterator) {
    return this.then(value => reject(value, iterator));
  }

  rejectSeries(iterator) {
    return this.then(value => rejectSeries(value, iterator));
  }

  rejectLimit(limit, iterator) {
    return this.then(value => rejectLimit(value, limit, iterator));
  }

  find(iterator) {
    return this.then(value => find(value, iterator));
  }

  findSeries(iterator) {
    return this.then(value => findSeries(value, iterator));
  }

  findLimit(limit, iterator) {
    return this.then(value => findLimit(value, limit, iterator));
  }

  pick(iterator) {
    return this.then(value => pick(value, iterator));
  }

  pickSeries(iterator) {
    return this.then(value => pickSeries(value, iterator));
  }

  pickLimit(limit, iterator) {
    return this.then(value => pickLimit(value, limit, iterator));
  }

  omit(iterator) {
    return this.then(value => omit(value, iterator));
  }

  omitSeries(iterator) {
    return this.then(value => omitSeries(value, iterator));
  }

  omitLimit(limit, iterator) {
    return this.then(value => omitLimit(value, limit, iterator));
  }

  reduce(result, iterator) {
    return this.then(value => reduce(value, result, iterator));
  }

  transform(result, iterator) {
    return this.then(value => transform(value, result, iterator));
  }

  transformSeries(result, iterator) {
    return this.then(value => transformSeries(value, result, iterator));
  }

  transformLimit(limit, result, iterator) {
    return this.then(value => transformLimit(value, limit, result, iterator));
  }

  sortBy(iterator) {
    return this.then(value => sortBy(value, iterator));
  }

  sortBySeries(iterator) {
    return this.then(value => sortBySeries(value, iterator));
  }

  sortByLimit(limit, iterator) {
    return this.then(value => sortByLimit(value, limit, iterator));
  }

  some(iterator) {
    return this.then(value => some(value, iterator));
  }

  someSeries(iterator) {
    return this.then(value => someSeries(value, iterator));
  }

  someLimit(limit, iterator) {
    return this.then(value => someLimit(value, limit, iterator));
  }

  every(iterator) {
    return this.then(value => every(value, iterator));
  }

  everySeries(iterator) {
    return this.then(value => everySeries(value, iterator));
  }

  everyLimit(limit, iterator) {
    return this.then(value => everyLimit(value, limit, iterator));
  }

  concat(iterator) {
    return this.then(value => concat(value, iterator));
  }

  concatSeries(iterator) {
    return this.then(value => concatSeries(value, iterator));
  }

  concatLimit(limit, iterator) {
    return this.then(value => concatLimit(value, limit, iterator));
  }

  groupBy(iterator) {
    return this.then(value => groupBy(value, iterator));
  }

  groupBySeries(iterator) {
    return this.then(value => groupBySeries(value, iterator));
  }

  groupByLimit(limit, iterator) {
    return this.then(value => groupByLimit(value, limit, iterator));
  }

  delay(ms) {
    const promise = new Delay(ms);
    this._resolved === 0 ? this._addReceiver(promise) : push(this, promise);
    return promise;
  }

  timeout(ms, message) {
    const promise = new Timeout(ms, message);
    this._resolved === 0 ? this._addReceiver(promise) : push(this, promise);
    return promise;
  }

  whilst(test, iterator) {
    return this.then(value => whilst(value, test, iterator));
  }

  doWhilst(iterator, test) {
    return this.then(value => doWhilst(value, iterator, test));
  }

  until(test, iterator) {
    return this.then(value => until(value, test, iterator));
  }

  doUntil(iterator, test) {
    return this.then(value => doUntil(value, iterator, test));
  }

  times(iterator) {
    return this.then(value => times(value, iterator));
  }

  timesSeries(iterator) {
    return this.then(value => timesSeries(value, iterator));
  }

  timesLimit(limit, iterator) {
    return this.then(value => timesLimit(value, limit, iterator));
  }

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
    if (_receiver.__AIGLE_PROXY__) {
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
    if (_receiver.__AIGLE_PROXY__) {
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

class AigleProxy extends Aigle {

  constructor() {
    super(INTERNAL);
    this.__PROXY__ = true;
  }

  _callResolve(value) {
    this._resolve(value);
  }

  _callReject(reason) {
    this._reject(reason);
  }
}

module.exports = { Aigle, AigleProxy, push };

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
  promise._resolve(value);
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

module.exports = Aigle;

function execute(promise, executor) {
  try {
    executor(resolve, reject);
  } catch(e) {
    reject(e);
  }

  function resolve(value) {
    promise._resolve(value);
  }

  function reject(reason) {
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
    promise.then(makeResolve(receiver), makeReject(receiver));
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
    promise.then(makeResolve(receiver), makeReject(receiver));
  } else {
    receiver._resolve(promise);
  }
}

function createOnRejected(receiver, errorTypes, onRejected) {
  return reason => {
    let l = errorTypes.length;
    while (l--) {
      if (reason instanceof errorTypes[l]) {
        callReject(receiver, onRejected, reason);
        return;
      }
    }
    receiver._reject(reason);
  };
}

function createFinallyHandler(promise, handler) {
  return () => {
    const { _resolved, _value } = promise;
    const res = handler();
    if (res instanceof AigleCore) {
      switch (res._resolved) {
      case 1:
        res._resolved = _resolved;
        res._value = _value;
        return res;
      case 2:
        return res;
      }
    }
    const p = new Aigle(INTERNAL);
    if (!res || !res.then) {
      p._resolved = _resolved;
      p._value = _value;
      return p;
    }
    if (_resolved === 1) {
      res.then(() => p._resolve(_value), makeReject(p));
    } else {
      res.then(() => p._reject(_value), makeReject(p));
    }
    return p;
  };
}

function tick() {
  while (queue.head) {
    const { promise, receiver, onFulfilled, onRejected } = queue.shift();
    const { _resolved, _key, _value } = promise;
    if (_resolved === 1) {
      if (receiver.__AIGLE_PROXY__) {
        receiver._callResolve(_value, _key);
      } else if (_key === INTERNAL) {
        receiver._resolve(_value);
      } else {
        callResolve(receiver, onFulfilled, _value);
      }
    } else {
      if (receiver.__AIGLE_PROXY__) {
        receiver._callReject(_value, _key);
      } else if (_key === INTERNAL) {
        receiver._resolve(_value);
      } else {
        callReject(receiver, onRejected, _value);
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

