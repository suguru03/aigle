'use strict';

const AigleCore = require('aigle-core');
const Queue = require('./internal/queue');
const Task = require('./internal/task');
const { INTERNAL, errorObj, call } = require('./internal/util');
const queue = new Queue();

class Aigle extends AigleCore {

  constructor(executor) {
    super();
    this._resolved = 0;
    this._value = undefined;
    this._key = undefined;
    this._receiver = undefined;
    this._onFullFilled = undefined;
    this._onRejected = undefined;
    this._receivers = undefined;
    if (executor === INTERNAL) {
      return;
    }
    execute(this, executor);
  }

  toString() {
    return '[object Aigle]';
  }

  then(onFullfilled, onRejected) {
    const promise = new Aigle(INTERNAL);
    if (this._resolved === 0) {
      this._addAigle(promise, onFullfilled, onRejected);
    } else {
      push(this, promise, onFullfilled, onRejected);
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
    return this.then(value => new Join(value, handler));
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

  detect(iterator) {
    return this.then(value => detect(value, iterator));
  }

  detectSeries(iterator) {
    return this.then(value => detectSeries(value, iterator));
  }

  detectLimit(limit, iterator) {
    return this.then(value => detectLimit(value, limit, iterator));
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

  someLimit(limit, iterator) {
    return this.then(value => someLimit(value, limit, iterator));
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

  /* internal functions */

  _resolve(value) {
    this._resolved = 1;
    this._value = value;
    if (this._receiver === undefined) {
      return;
    }
    const { _receiver, _key } = this;
    this._receiver = undefined;
    if (_receiver instanceof AigleProxy) {
      _receiver._callResolve(value, _key);
    } else if (_key === INTERNAL) {
      _receiver._resolve(value);
    } else {
      callResolve(_receiver, this._onFullFilled, value);
    }
    if (!this._receivers) {
      return;
    }
    const { _receivers } = this;
    this._receivers = undefined;
    while (_receivers.head) {
      const { receiver, onFullfilled } = _receivers.shift();
      callResolve(receiver, onFullfilled, value);
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

  _addAigle(receiver, onFullfilled, onRejected) {
    if (this._receiver === undefined) {
      this._receiver = receiver;
      this._onFullFilled = onFullfilled;
      this._onRejected = onRejected;
      return;
    }
    if (!this._receivers) {
      this._receivers = new Queue();
    }
    this._receivers.push(new Task(undefined, receiver, onFullfilled, onRejected));
  }

  _addReceiver(receiver, key) {
    this._key = key;
    this._receiver = receiver;
  }
}

class AigleProxy extends Aigle {

  constructor() {
    super(INTERNAL);
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
const all = require('./all');
const race = require('./race');
const props = require('./props');
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
const detect = require('./detect');
const detectSeries = require('./detectSeries');
const { detectLimit } = require('./detectLimit');
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
const someLimit = require('./someLimit');
const { join, Join } = require('./join');
const { delay, Delay } = require('./delay');
const Timeout = require('./timeout');

/* core functions */
Aigle.resolve = _resolve;
Aigle.reject = _reject;

/* collections */
Aigle.all = all;
Aigle.race = race;
Aigle.props = props;
Aigle.each = each;
Aigle.forEach = each;
Aigle.eachSeries = eachSeries;
Aigle.forEachSeries = eachSeries;
Aigle.eachLimit = eachLimit;
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
Aigle.detect = detect;
Aigle.detectSeries = detectSeries;
Aigle.detectLimit = detectLimit;
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
Aigle.someLimit = someLimit;

Aigle.join = join;
Aigle.promisify = require('./promisify');
Aigle.promisifyAll = require('./promisifyAll');
Aigle.delay = delay;

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

function callResolve(receiver, onFullfilled, value) {
  if (typeof onFullfilled !== 'function') {
    receiver._resolve(value);
    return;
  }
  const promise = call(onFullfilled, value);
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
    promise.then(value => receiver._resolve(value), reason => receiver._reject(reason));
  } else {
    receiver._resolve(promise);
  }
}

function callReject(receiver, onRejected, reason) {
  if (typeof onRejected !== 'function') {
    receiver._reject(reason);
    return;
  }
  const promise = call(onRejected, reason);
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
    promise.then(value => receiver._resolve(value), reason => receiver._reject(reason));
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
      res.then(() => p._resolve(_value), reason => p._reject(reason));
    } else {
      res.then(() => p._reject(_value), reason => p._reject(reason));
    }
    return p;
  };
}

function tick() {
  while (queue.head) {
    const { promise, receiver, onFullfilled, onRejected } = queue.shift();
    const { _resolved, _key, _value } = promise;
    if (_resolved === 1) {
      if (receiver instanceof AigleProxy) {
        receiver._callResolve(_value, _key);
      } else if (_key === INTERNAL) {
        receiver._resolve(_value);
      } else {
        callResolve(receiver, onFullfilled, _value);
      }
    } else {
      if (receiver instanceof AigleProxy) {
        receiver._callReject(_value, _key);
      } else if (_key === INTERNAL) {
        receiver._resolve(_value);
      } else {
        callReject(receiver, onRejected, _value);
      }
    }
  }
}

function push(promise, receiver, onFullfilled, onRejected) {
  if (!queue.head) {
    setImmediate(tick);
  }
  queue.push(new Task(promise, receiver, onFullfilled, onRejected));
}

