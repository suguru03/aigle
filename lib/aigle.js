'use strict';

const AigleCore = require('aigle-core');
const Queue = require('./internal/queue');
const Task = require('./internal/task');
const queue = new Queue();
const errorObj = { e: undefined };

function INTERNAL() {}

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
    const promise = new Aigle(INTERNAL);
    handler = typeof handler !== 'function' ? handler : createSpreadHandler(handler);
    if (this._resolved === 0) {
      this._addAigle(promise, handler);
    } else {
      push(this, promise, handler);
    }
    return promise;
  }

  all() {
    return this.then(Aigle.all);
  }

  race() {
    return this.then(Aigle.race);
  }

  props() {
    return this.then(Aigle.props);
  }

  delay(ms) {
    return this.then(value => Aigle.delay(ms, value));
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
    if (_key === INTERNAL) {
      _receiver._resolve(value);
    } else if (_receiver instanceof AigleProxy) {
      _receiver._callResolve(value, _key);
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
    if (_key === INTERNAL) {
      _receiver._reject(reason);
    } else if (_receiver instanceof AigleProxy) {
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
    if (this._receiver === undefined) {
      this._key = key;
      this._receiver = receiver;
      return;
    }
    const { _receiver, _onFullFilled, _onRejected } = this;
    this._key = key;
    this._receiver = receiver;
    this._addAigle(_receiver, _onFullFilled, _onRejected);
  }
}

class AigleProxy extends Aigle {
  constructor() {
    super(INTERNAL);
  }
}

module.exports = { Aigle, AigleProxy, INTERNAL };

Aigle.resolve = resolve;
Aigle.reject = reject;

/* collections */

Aigle.all = require('./all');
Aigle.race = require('./race');
Aigle.props = require('./props');

Aigle.join = require('./join');
Aigle.promisify = require('./promisify');
Aigle.promisifyAll = require('./promisifyAll');
Aigle.delay = require('./delay');

function resolve(value) {
  const promise = new Aigle(INTERNAL);
  promise._resolve(value);
  return promise;
}

function reject(reason) {
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
  const promise = tryCatch(onFullfilled, value);
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
  const promise = tryCatch(onRejected, reason);
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
        return callReject(receiver, onRejected, reason);
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

function createSpreadHandler(handler) {
  return _value => {
    switch (_value.length) {
    case 0:
      return handler();
    case 1:
      return handler(_value[0]);
    case 2:
      return handler(_value[0], _value[1]);
    case 3:
      return handler(_value[0], _value[1], _value[2]);
    default:
      return handler.apply(null, _value);
    }
  };
}

function tick() {
  while (queue.head) {
    const { promise, receiver, onFullfilled, onRejected } = queue.shift();
    if (promise._resolved === 1) {
      callResolve(receiver, onFullfilled, promise._value);
    } else {
      callReject(receiver, onRejected, promise._value);
    }
  }
}

function push(promise, receiver, onFullfilled, onRejected) {
  if (!queue.head) {
    setImmediate(tick);
  }
  queue.push(new Task(promise, receiver, onFullfilled, onRejected));
}

function tryCatch(func, value) {
  try {
    return func(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}
