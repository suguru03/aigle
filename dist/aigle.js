(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Promise = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

require('setimmediate');
module.exports = require('./lib/aigle');

},{"./lib/aigle":2,"setimmediate":64}],2:[function(require,module,exports){
(function (process){
'use strict';

const AigleCore = require('aigle-core');
const Queue = require('./internal/queue');
const Task = require('./internal/task');
const { INTERNAL, errorObj, call1, makeResolve, makeReject } = require('./internal/util');
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
    return '[object Promise]';
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

  /* internal functions */

  _resolve(value) {
    this._resolved = 1;
    this._value = value;
    if (this._receiver === undefined) {
      return;
    }
    const { _receiver, _key } = this;
    this._receiver = undefined;
    if (_receiver instanceof AigleCore && _receiver.__PROXY__) {
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
    if (_receiver instanceof AigleCore && _receiver.__PROXY__) {
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
const { join, Join } = require('./join');
const { delay, Delay } = require('./delay');
const Timeout = require('./timeout');
const { whilst } = require('./whilst');
const { doWhilst } = require('./doWhilst');
const { until } = require('./until');
const doUntil = require('./doUntil');

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

Aigle.join = join;
Aigle.promisify = require('./promisify');
Aigle.promisifyAll = require('./promisifyAll');
Aigle.delay = delay;
Aigle.whilst = whilst;
Aigle.doWhilst = doWhilst;
Aigle.until = until;
Aigle.doUntil = doUntil;

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
  const promise = call1(onFullfilled, value);
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
    const { promise, receiver, onFullfilled, onRejected } = queue.shift();
    const { _resolved, _key, _value } = promise;
    if (_resolved === 1) {
      if (receiver instanceof AigleCore && receiver.__PROXY__) {
        receiver._callResolve(_value, _key);
      } else if (_key === INTERNAL) {
        receiver._resolve(_value);
      } else {
        callResolve(receiver, onFullfilled, _value);
      }
    } else {
      if (receiver instanceof AigleCore && receiver.__PROXY__) {
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


}).call(this,require('_process'))
},{"./all":3,"./concat":4,"./concatLimit":5,"./concatSeries":6,"./delay":7,"./doUntil":8,"./doWhilst":9,"./each":10,"./eachLimit":11,"./eachSeries":12,"./error":13,"./every":14,"./everyLimit":15,"./everySeries":16,"./filter":17,"./filterLimit":18,"./filterSeries":19,"./find":20,"./findLimit":21,"./findSeries":22,"./internal/queue":25,"./internal/task":26,"./internal/util":27,"./join":28,"./map":29,"./mapLimit":30,"./mapSeries":31,"./mapValues":32,"./mapValuesLimit":33,"./mapValuesSeries":34,"./omit":35,"./omitLimit":36,"./omitSeries":37,"./parallel":38,"./pick":39,"./pickLimit":40,"./pickSeries":41,"./promisify":42,"./promisifyAll":43,"./props":44,"./race":45,"./reduce":46,"./reject":47,"./rejectLimit":48,"./rejectSeries":49,"./some":50,"./someLimit":51,"./someSeries":52,"./sortBy":53,"./sortByLimit":54,"./sortBySeries":55,"./timeout":56,"./transform":57,"./transformLimit":58,"./transformSeries":59,"./until":60,"./whilst":61,"_process":63,"aigle-core":62}],3:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('./aigle');
const { promiseArrayEach } = require('./internal/util');

class AigleAll extends AigleProxy {

  constructor(array) {
    super();
    promiseArrayEach(this, array);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = { all, AigleAll };

function all(array) {
  return new AigleAll(array);
}


},{"./aigle":2,"./internal/util":27}],4:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class ConcatArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = [];
    }
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class ConcatObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = [];
    }
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
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

},{"./aigle":2,"./internal/aigleEach":23}],5:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class ConcatLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = [];
    }
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class ConcatLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = [];
    }
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = concatLimit;

function concatLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24}],6:[function(require,module,exports){
'use strict';

const concatLimit = require('./concatLimit');

module.exports = concatSeries;

function concatSeries(collection, iterator) {
  return concatLimit(collection, 1, iterator);
}

},{"./concatLimit":5}],7:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('./aigle');

class Delay extends AigleProxy {

  constructor(ms) {
    super();
    this._ms = ms;
  }

  _callResolve(value) {
    setTimeout(() => this._resolve(value), this._ms);
  }
}

module.exports = { delay, Delay };

function delay(ms, value) {
  const promise = new Delay(ms);
  promise._callResolve(value);
  return promise;
}

},{"./aigle":2}],8:[function(require,module,exports){
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

},{"./doWhilst":9,"./until":60}],9:[function(require,module,exports){
'use strict';

const { AigleWhilst, WhilstTester } = require('./whilst');

class DoWhilst extends AigleWhilst {

  constructor(test, iterator) {
    super(test, iterator);
  }

  _iterate(value) {
    this._next(value);
    return this;
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

},{"./whilst":61}],10:[function(require,module,exports){
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

},{"./aigle":2,"./internal/aigleEach":23}],11:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

module.exports = eachLimit;

function eachLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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


},{"./aigle":2,"./internal/aigleLimit":24}],12:[function(require,module,exports){
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


},{"./aigle":2,"./internal/aigleLimit":24}],13:[function(require,module,exports){
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
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
    }
  }
}

class EveryObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
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

},{"./aigle":2,"./internal/aigleEach":23}],15:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class EveryLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class EveryLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = everyLimit;

function everyLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24}],16:[function(require,module,exports){
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
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    }
  }
}

class FilterObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
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

},{"./aigle":2,"./internal/aigleEach":23,"./internal/util":27}],18:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class FilterLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class FilterLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { filterLimit, FilterLimitArray, FilterLimitObject };

function filterLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24,"./internal/util":27}],19:[function(require,module,exports){
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
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._resolve();
    }
  }
}

class FindObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
  }

  _callResolve(value, index) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._resolve();
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

},{"./aigle":2,"./internal/aigleEach":23}],21:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class FindLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
  }

  _callResolve(value, index) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._resolve();
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
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { findLimit, FindLimitArray, FindLimitObject };

function findLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24}],22:[function(require,module,exports){
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

const { AigleProxy } = require('../aigle');
const { call2, callProxyReciever } = require('./util');

class AigleEachArray extends AigleProxy {

  constructor(array, iterator) {
    super();
    const size = array.length;
    this._rest = size;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._array = array;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _array } = this;
    while (++i < _rest && callProxyReciever(call2(_iterator, _array[i], i), this, i)) {}
    return this;
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

class AigleEachObject extends AigleProxy {

  constructor(object, iterator) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._rest = size;
    if (size === 0) {
      this._resolve();
      return;
    }
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
  }

  _iterate() {
    let i = -1;
    const { _rest, _iterator, _keys, _object } = this;
    while (++i < _rest) {
      const key = _keys[i];
      if (callProxyReciever(call2(_iterator, _object[key], key), this, i) === false) {
        break;
      }
    }
    return this;
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

module.exports = { AigleEachArray, AigleEachObject };

},{"../aigle":2,"./util":27}],24:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('../aigle');
const { DEFAULT_LIMIT, call2, callProxyReciever } = require('./util');

class AigleLimitArray extends AigleProxy {

  constructor(array, iterator, limit) {
    super();
    const size = array.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._rest = 0;
      this._resolve();
      return;
    }
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._rest = size;
    this._size = size;
    this._array = array;
    this._iterator = iterator;
  }

  _iterate() {
    if (this._resolved !== 0) {
      return this;
    }
    while (this._limit--) {
      this._next();
    }
    return this;
  }

  _next() {
    const i = this._index++;
    callProxyReciever(call2(this._iterator, this._array[i], i), this, i);
  }

  _callResolve() {
    if (this._resolved !== 0) {
      return;
    }
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

class AigleLimitObject extends AigleProxy {

  constructor(object, iterator, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._rest = 0;
      this._resolve();
      return;
    }
    this._limit = limit > size ? size : limit;
    this._index = 0;
    this._keys = keys;
    this._rest = size;
    this._size = size;
    this._object = object;
    this._iterator = iterator;
  }

  _iterate() {
    if (this._resolved !== 0) {
      return this;
    }
    while (this._limit--) {
      this._next();
    }
    return this;
  }

  _next() {
    const i = this._index++;
    const key = this._keys[i];
    callProxyReciever(call2(this._iterator, this._object[key], key), this, i);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject };

},{"../aigle":2,"./util":27}],25:[function(require,module,exports){
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

  unshift(task) {
    const head = this.head;
    this.head = task;
    if (head) {
      task.tail = head;
    } else {
      this.tail = task;
    }
  }

  shift() {
    const head = this.head;
    if (head) {
      this.head = head.tail;
    } else {
      return;
    }
    if (!this.head) {
      this.tail = null;
    }
    return head;
  }
}

module.exports = Queue;

},{}],26:[function(require,module,exports){
'use strict';

class Task {

  constructor(promise, receiver, onFullfilled, onRejected) {
    this.promise = promise;
    this.receiver = receiver;
    this.onFullfilled = onFullfilled;
    this.onRejected = onRejected;
    this.head = undefined;
    this.tail = undefined;
  }
}

module.exports = Task;

},{}],27:[function(require,module,exports){
'use strict';

const AigleCore = require('aigle-core');
const DEFAULT_LIMIT = 8;
const errorObj = { e: undefined };
class DummyPromise {

  constructor(value, key) {
    this._resolved = 1;
    this._key = key;
    this._value = value;
  }
}

module.exports = {
  DEFAULT_LIMIT,
  DummyPromise,
  INTERNAL,
  errorObj,
  call1,
  call2,
  call3,
  callProxyReciever,
  apply,
  makeResolve,
  makeReject,
  makeCallResolve,
  promiseArrayEach,
  promiseObjectEach,
  compactArray,
  clone,
  cloneArray,
  cloneObject,
  sort
};

function INTERNAL() {}

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

function callProxyReciever(promise, receiver, index) {
  if (promise === errorObj) {
    receiver._reject(errorObj.e);
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
      receiver._reject(promise._value);
      return false;
    }
  }
  if (promise && promise.then) {
    promise.then(makeCallResolve(receiver, index), makeReject(receiver));
  } else {
    receiver._callResolve(promise, index);
  }
  return true;
}

function makeResolve(promise) {
  return function(value) {
    promise._resolve(value);
  };
}

function makeReject(promise) {
  return function(reason) {
    promise._reject(reason);
  };
}

function makeCallResolve(promise, key) {
  return function(value) {
    promise._callResolve(value, key);
  };
}

function promiseArrayEach(promise, array) {
  const size = array.length;
  if (size === 0) {
    promise._resolve([]);
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = array;
  while (++i < size) {
    const p = array[i];
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        p._addReceiver(promise, i);
        continue;
      case 1:
        promise._callResolve(p._value, i);
        continue;
      case 2:
        promise._reject(p._value);
        return;
      }
    }
    if (p && p.then) {
      p.then(makeCallResolve(promise, i), makeReject(promise));
    } else {
      promise._callResolve(p, i);
    }
  }
}

function promiseObjectEach(promise, object) {
  if (!object) {
    promise._resolve({});
    return;
  }
  const keys = Object.keys(object);
  const size = keys.length;
  if (size === 0) {
    promise._resolve({});
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = {};
  while (++i < size) {
    const key = keys[i];
    const p = object[key];
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        p._addReceiver(promise, key);
        continue;
      case 1:
        promise._callResolve(p._value, key);
        continue;
      case 2:
        promise._reject(p._value);
        return;
      }
    }
    if (p && p.then) {
      p.then(makeCallResolve(promise, key), makeReject(promise));
    } else {
      promise._callResolve(p, key);
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

},{"aigle-core":62}],28:[function(require,module,exports){
'use strict';

const AigleCore = require('aigle-core');
const { AigleProxy } = require('./aigle');
const {
  errorObj,
  apply,
  makeResolve,
  makeReject,
  promiseArrayEach
} = require('./internal/util');

class Join extends AigleProxy {

  constructor(array, handler) {
    super();
    this._handler = handler;
    promiseArrayEach(this, array);
  }

  _spread() {
    const { _result } = this;
    if (this._handler === undefined) {
      return this._resolve(_result);
    }
    const p = apply(this._handler, _result);
    if (p === errorObj) {
      return this._reject(errorObj.e);
    }
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        return p._addReceiver(this);
      case 1:
        return this._callResolve(p._value);
      case 2:
        return this._reject(p._value);
      }
    }
    if (p && p.then) {
      p.then(makeResolve(this), makeReject(this));
    } else {
      this._callResolve(p);
    }
  }

  _callResolve(value, index) {
    if (this._rest === 0) {
      return this._resolve(value);
    }
    this._result[index] = value;
    if (--this._rest === 0) {
      this._spread();
    }
  }
}

module.exports = { join, Join };

function join() {
  let l = arguments.length;
  const handler = typeof arguments[l - 1] === 'function' ? arguments[--l] : undefined;
  const array = Array(l);
  while (l--) {
    array[l] = arguments[l];
  }
  return new Join(array, handler);
}

},{"./aigle":2,"./internal/util":27,"aigle-core":62}],29:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class MapArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class MapObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
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

},{"./aigle":2,"./internal/aigleEach":23}],30:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class MapLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class MapLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { mapLimit, MapLimitArray, MapLimitObject };

function mapLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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


},{"./aigle":2,"./internal/aigleLimit":24}],31:[function(require,module,exports){
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

},{"./aigle":2,"./mapLimit":30}],32:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class MapValuesArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    if (this._rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class MapValuesObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    if (this._rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    this._result[this._keys[index]] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
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

},{"./aigle":2,"./internal/aigleEach":23}],33:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class MapValuesLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    if (this._rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class MapValuesLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    if (this._rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    this._result[this._keys[index]] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { mapValuesLimit, MapValuesLimitArray, MapValuesLimitObject };

function mapValuesLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24}],34:[function(require,module,exports){
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

},{"./aigle":2,"./mapValuesLimit":33}],35:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class OmitArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (!value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class OmitObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (!value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
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

},{"./aigle":2,"./internal/aigleEach":23}],36:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class OmitLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (!value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class OmitLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (!value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { omitLimit, OmitLimitArray, OmitLimitObject };

function omitLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24}],37:[function(require,module,exports){
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

},{"./aigle":2,"./omitLimit":36}],38:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleAll } = require('./all');
const { AigleProps } = require('./props');

module.exports = parallel;

function parallel(collection) {
  if (Array.isArray(collection)) {
    return new AigleAll(collection);
  }
  if (collection && typeof collection === 'object') {
    return new AigleProps(collection);
  }
  return Aigle.resolve({});
}


},{"./aigle":2,"./all":3,"./props":44}],39:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class PickArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class PickObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
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

},{"./aigle":2,"./internal/aigleEach":23}],40:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class PickLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class PickLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { pickLimit, PickLimitArray, PickLimitObject };

function pickLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24}],41:[function(require,module,exports){
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

},{"./aigle":2,"./pickLimit":40}],42:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL } = require('./internal/util');

module.exports = promisify;

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

  return promisified;

  function promisified(arg) {
    const promise = new Aigle(INTERNAL);
    const callback = makeCallback(promise);
    let l = arguments.length;
    switch (l) {
    case 0:
      ctx ? fn.call(ctx, callback) : fn(callback);
      break;
    case 1:
      ctx ? fn.call(ctx, arg, callback) : fn(arg, callback);
      break;
    default:
      const args = Array(l);
      while (l--) {
        args[l] = arguments[l];
      }
      args[args.length] = callback;
      fn.apply(ctx, args);
      break;
    }
    return promise;
  }
}

},{"./aigle":2,"./internal/util":27}],43:[function(require,module,exports){
'use strict';

const promisify = require('./promisify');

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
        throw new TypeError(`Cannot promisify an API that has normal methods with '${suffix}'-suffix`);
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
    if (memo[key] === true || key === 'constructor' || filter(key)) {
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

},{"./promisify":42}],44:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('./aigle');
const { promiseObjectEach } = require('./internal/util');

class AigleProps extends AigleProxy {

  constructor(object) {
    super();
    promiseObjectEach(this, object);
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = { props, AigleProps };

function props(object) {
  return new AigleProps(object);
}

},{"./aigle":2,"./internal/util":27}],45:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('./aigle');
const { promiseArrayEach } = require('./internal/util');

class Race extends AigleProxy {

  constructor(array) {
    super();
    promiseArrayEach(this, array);
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    this._resolve(value);
  }
}

module.exports = race;

function race(array) {
  return new Race(array);
}

},{"./aigle":2,"./internal/util":27}],46:[function(require,module,exports){
'use strict';

const { Aigle, AigleProxy } = require('./aigle');
const { call3, callProxyReciever } = require('./internal/util');

class ReduceArray extends AigleProxy {

  constructor(array, iterator, result) {
    super();
    const size = array.length;
    if (size === 0) {
      this._resolve(result);
      return;
    }
    this._rest = size;
    this._array = array;
    this._iterator = iterator;
    if (result === undefined) {
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
      this._resolve(result);
    } else {
      this._next(++index, result);
    }
  }
}

class ReduceObject extends AigleProxy {

  constructor(object, iterator, result) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0) {
      this._resolve(result);
      return;
    }
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    if (result === undefined) {
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
      this._resolve(result);
    } else {
      this._next(++index, result);
    }
  }
}

module.exports = reduce;

function reduce(collection, result, iterator) {
  if (iterator === undefined && typeof result === 'function') {
    iterator = result;
    result = undefined;
  }
  if (Array.isArray(collection)) {
    return new ReduceArray(collection, iterator, result);
  }
  if (collection && typeof collection === 'object') {
    return new ReduceObject(collection, iterator, result);
  }
  return Aigle.resolve(result);
}

},{"./aigle":2,"./internal/util":27}],47:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class RejectArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    }
  }
}

class RejectObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
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

},{"./aigle":2,"./internal/aigleEach":23,"./internal/util":27}],48:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class RejectLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class RejectLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { rejectLimit, RejectLimitArray, RejectLimitObject };

function rejectLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24,"./internal/util":27}],49:[function(require,module,exports){
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

},{"./aigle":2,"./rejectLimit":48}],50:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class SomeArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    if (this._rest === 0) {
      this._value = false;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(true);
    } else if (--this._rest === 0) {
      this._resolve(false);
    }
  }
}

class SomeObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    if (this._rest === 0) {
      this._value = false;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(true);
    } else if (--this._rest === 0) {
      this._resolve(false);
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

},{"./aigle":2,"./internal/aigleEach":23}],51:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class SomeLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    if (this._rest === 0) {
      this._value = false;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(true);
    } else if (--this._rest === 0) {
      this._resolve(false);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class SomeLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    if (this._rest === 0) {
      this._value = false;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(true);
    } else if (--this._rest === 0) {
      this._resolve(false);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = someLimit;

function someLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24}],52:[function(require,module,exports){
'use strict';

const someLimit = require('./someLimit');

module.exports = someSeries;

function someSeries(collection, iterator) {
  return someLimit(collection, 1, iterator);
}

},{"./someLimit":51}],53:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');
const { sort } = require('./internal/util');

class SortByArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._resolve(sort(this._result));
    }
  }
}

class SortByObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._resolve(sort(this._result));
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

},{"./aigle":2,"./internal/aigleEach":23,"./internal/util":27}],54:[function(require,module,exports){
'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');
const { sort } = require('./internal/util');

class SortByLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class SortByLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = sortByLimit;

function sortByLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
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

},{"./aigle":2,"./internal/aigleLimit":24,"./internal/util":27}],55:[function(require,module,exports){
'use strict';

const sortByLimit = require('./sortByLimit');

module.exports = sortBySeries;

function sortBySeries(collection, iterator) {
  return sortByLimit(collection, 1, iterator);
}

},{"./sortByLimit":54}],56:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('./aigle');
const { TimeoutError } = require('./error');

class Timeout extends AigleProxy {

  constructor(ms, message) {
    super();
    this._message = message;
    this._timer = setTimeout(() => {
      if (message instanceof Error) {
        this._reject(message);
      } else {
        this._reject(new TimeoutError('operation timed out'));
      }
    }, ms);
  }

  _callResolve(value) {
    clearTimeout(this._timer);
    this._resolve(value);
  }

  _callReject(reason) {
    clearTimeout(this._timer);
    this._reject(reason);
  }
}

module.exports = Timeout;

},{"./aigle":2,"./error":13}],57:[function(require,module,exports){
'use strict';

const { Aigle, AigleProxy } = require('./aigle');
const { clone } = require('./internal/util');
const { call3, callProxyReciever } = require('./internal/util');

class TransformArray extends AigleProxy {

  constructor(array, iterator, result) {
    super();
    const size = array.length;
    if (size === 0) {
      this._resolve(result);
      return;
    }
    this._rest = size;
    this._array = array;
    this._iterator = iterator;
    this._result = result;
    this._iterate();
  }

  _iterate() {
    let i = -1;
    const { _rest, _array, _iterator, _result } = this;
    while (++i < _rest && callProxyReciever(call3(_iterator, _result, _array[i], i), this, i)) {}
  }

  _callResolve(bool) {
    if (bool === false) {
      if (this._resolved !== 0) {
        return;
      }
      this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class TransformObject extends AigleProxy {

  constructor(object, iterator, result) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0) {
      this._resolve(result);
      return;
    }
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._iterator = iterator;
    this._result = result;
    this._iterate();
  }

  _iterate() {
    let i = -1;
    const { _rest, _object, _keys, _iterator, _result } = this;
    while (++i < _rest) {
      const key = _keys[i];
      if (callProxyReciever(call3(_iterator, _result, _object[key], key), this, i) === false) {
        break;
      }
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      if (this._resolved !== 0) {
        return;
      }
      this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    }
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
    return new TransformArray(collection, iterator, accumulator);
  }
  if (collection && typeof collection === 'object') {
    if (iterator === undefined && typeof accumulator === 'function') {
      iterator = accumulator;
      accumulator = {};
    }
    return new TransformObject(collection, iterator, accumulator);
  }
  return Aigle.resolve(arguments.length === 2 ? {} : accumulator);
}

},{"./aigle":2,"./internal/util":27}],58:[function(require,module,exports){
'use strict';

const { Aigle, AigleProxy } = require('./aigle');
const { DEFAULT_LIMIT, call3, callProxyReciever, clone } = require('./internal/util');

class TransformLimitArray extends AigleProxy {

  constructor(array, iterator, result, limit) {
    super();
    const size = array.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._resolve(result);
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
    if (this._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

class TransformLimitObject extends AigleProxy {

  constructor(object, iterator, result, limit) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    if (size === 0 || isNaN(limit) || limit < 1) {
      this._resolve(result);
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
    if (this._resolved !== 0) {
      return;
    }
    if (bool === false) {
      this._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
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
    return new TransformLimitArray(collection, iterator, accumulator, limit);
  }
  if (collection && typeof collection === 'object') {
    return new TransformLimitObject(collection, iterator, accumulator, limit);
  }
  return Aigle.resolve(accumulator);
}

},{"./aigle":2,"./internal/util":27}],59:[function(require,module,exports){
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

},{"./transformLimit":58}],60:[function(require,module,exports){
'use strict';

const { AigleWhilst, WhilstTester } = require('./whilst');

class UntilTester extends WhilstTester {

  constructor(tester) {
    super(tester);
  }

  _callResolve(value) {
    if (value) {
      this._promise._resolve(this._promiseValue);
    } else {
      this._promise._next(this._promiseValue);
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

},{"./whilst":61}],61:[function(require,module,exports){
'use strict';

const { AigleProxy } = require('./aigle');
const { callProxyReciever, call1 } = require('./internal/util');

class WhilstTester extends AigleProxy {

  constructor(tester) {
    super();
    this._tester = tester;
    this._promise = undefined;
    this._promiseValue = undefined;
  }

  _test(value) {
    this._promiseValue = value;
    callProxyReciever(call1(this._tester, value), this, undefined);
  }

  _callResolve(value) {
    if (value) {
      this._promise._next(this._promiseValue);
    } else {
      this._promise._resolve(this._promiseValue);
    }
  }

  _callReject(reason) {
    this._promise._callReject(reason);
  }
}

class AigleWhilst extends AigleProxy {

  constructor(tester, iterator) {
    super();
    tester._promise = this;
    this._tester = tester;
    this._iterator = iterator;
  }

  _iterate(value) {
    this._callResolve(value);
    return this;
  }

  _next(value) {
    callProxyReciever(call1(this._iterator, value), this, undefined);
  }

  _callResolve(value) {
    this._tester._test(value);
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

},{"./aigle":2,"./internal/util":27}],62:[function(require,module,exports){
'use strict';

class AigleCore {
  constructor() {}
}

module.exports = AigleCore;

},{}],63:[function(require,module,exports){
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

},{}],64:[function(require,module,exports){
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
},{"_process":63}]},{},[1])(1)
});