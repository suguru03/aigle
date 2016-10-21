'use strict';

const util = require('./internal/util');
const Queue = require('./internal/queue');
const queue = new Queue();
const noop = util.noop;
const errorObj = util.errorObj;
const tryCatch = util.tryCatch;

let ticked = false;

function tick() {
  while (queue.head) {
    const func = queue.shift();
    const promise = queue.shift();
    const value = queue.shift();
    func(promise, value);
  }
  ticked = false;
}

function push(task, promise, value) {
  queue.push(task);
  queue.push(promise);
  queue.push(value);
  if (ticked) {
    return;
  }
  ticked = true;
  setImmediate(tick);
}

function unshift(task, promise, value) {
  queue.unshift(value);
  queue.unshift(promise);
  queue.unshift(task);
  if (ticked) {
    return;
  }
  ticked = true;
  setImmediate(tick);
}

function callResolve(promise, value) {
  while (promise) {
    if (promise._resolved === 0) {
      promise._resolved = 1;
      promise._value = value;
    }
    const { _finallyHandler, _onFullfilled, _receiver, _receivers } = promise;
    if (_finallyHandler !== undefined) {
      callFinally(promise, 1, value);
      break;
    }
    promise._receiver = undefined;
    if (_onFullfilled === undefined) {
      promise = _receiver;
      continue;
    }
    promise._onFullfilled = undefined;
    const p = tryCatch(_onFullfilled, value);
    if (_receivers) {
      promise._receivers = undefined;
      while (_receivers.head) {
        const _receiver = _receivers.shift();
        const _onFullfilled = _receivers.shift();
        _receivers.shift();
        _receivers.shift();
        if (_onFullfilled === undefined) {
          continue;
        }
        const p = tryCatch(_onFullfilled, value);
        if (p === errorObj) {
          callReject(_receiver, p.e);
        } else if (p && p.then) {
          p.then(_receiver._callResolve, _receiver._callReject);
        } else {
          callResolve(_receiver, p);
        }
      }
    }
    if (p === errorObj) {
      callReject(_receiver, p.e);
    } else if (p && p.then) {
      p.then(_receiver._callResolve, _receiver._callReject);
      break;
    } else {
      promise = _receiver;
      value = p;
    }
  }
}

function callReject(promise, reason) {
  while (promise) {
    promise._resolved = 2;
    promise._value = reason;
    const { _finallyHandler, _onRejected, _receiver, _receivers } = promise;
    if (_finallyHandler !== undefined) {
      callFinally(promise, 2, reason);
      break;
    }
    promise._receiver = undefined;
    if (_onRejected === undefined) {
      promise = _receiver;
      continue;
    }
    promise._onRejected = undefined;
    if (_receivers) {
      promise._receivers = undefined;
      while (_receivers.head) {
        const _receiver = _receivers.shift();
        _receivers.shift();
        const _onRejected = _receivers.shift();
        _receivers.shift();
        if (_onRejected === undefined) {
          continue;
        }
        const { _errorTypes } = _onRejected;
        if (_errorTypes) {
          let l = _errorTypes.length;
          let found = false;
          while (found === false && l--) {
            found = reason instanceof _errorTypes[l];
          }
          if (found === false) {
            promise = _receiver;
            continue;
          }
        }
        const p = tryCatch(_onRejected, reason);
        if (p === errorObj) {
          callReject(_receiver, p.e);
        } else if (p && p.then) {
          p.then(_receiver._callResolve, _receiver._callReject);
        } else {
          callResolve(_receiver, p);
        }
      }
    }
    const { _errorTypes } = _onRejected;
    if (_errorTypes) {
      let l = _errorTypes.length;
      let found = false;
      while (found === false && l--) {
        found = reason instanceof _errorTypes[l];
      }
      if (found === false) {
        promise = _receiver;
        continue;
      }
    }
    const p = tryCatch(_onRejected, reason);
    if (p === errorObj) {
      promise = _receiver;
      reason = p.e;
    } else if (p && p.then) {
      p.then(_receiver._callResolve, _receiver._callReject);
      break;
    } else {
      callResolve(_receiver, p);
      break;
    }
  }
  process.emit('unhandledRejection', reason);
}

function callFinally(promise, resolved, value) {
  const { _finallyHandler, _receiver } = promise;
  const p = tryCatch(_finallyHandler, value);
  if (p === errorObj) {
    callReject(_receiver, p.e);
  } else if (p && p.then) {
    p.then(() => callResolve(_receiver, value), _receiver._callReject);
  } else {
    switch (resolved) {
    case 1:
      callResolve(_receiver, value);
      break;
    case 2:
      callReject(_receiver, value);
      break;
    }
  }
}

function makeCallResolve(promise) {
  return value => {
    if (promise._async) {
      callResolve(promise, value);
    } else {
      unshift(callResolve, promise, value);
    }
  };
}

function makeCallReject(promise) {
  return reason => {
    if (promise._async) {
      callReject(promise, reason);
    } else {
      unshift(callReject, promise, reason);
    }
  };
}

class Promise {

  constructor(executor) {
    const callResolve = makeCallResolve(this);
    const callReject = makeCallReject(this);
    this._callResolve = callResolve;
    this._callReject = callReject;
    this._resolved = 0;
    this._value = undefined;
    this._receiver = undefined;
    this._receivers = undefined;
    this._onFullfilled = undefined;
    this._onRejected = undefined;
    this._finallyHandler = undefined;
    this._async = false;
    if (executor === noop) {
      return;
    }
    executor(callResolve, callReject);
    this._async = true;
  }

  toString() {
    return '[object Promise]';
  }

  then(onFullfilled, onRejected) {
    const promise = new Promise(noop);
    const hasOnFullfiled = typeof onFullfilled === 'function';
    const hasOnRejected = typeof onRejected === 'function';
    if (this._receiver) {
      this._receivers = this._receivers || new Queue();
      this._receivers.push(promise);
      this._receivers.push(hasOnFullfiled ? onFullfilled : null);
      this._receivers.push(hasOnRejected ? onRejected : null);
      this._receivers.push(null);
      return promise;
    }
    this._receiver = promise;
    if (hasOnFullfiled) {
      this._onFullfilled = onFullfilled;
      switch (this._resolved) {
      case 1:
        push(callResolve, this, this._value);
        break;
      case 2:
        if (!hasOnRejected) {
          promise._resolved = 2;
          promise._value = this._value;
          return promise;
        }
        break;
      }
    }
    if (hasOnRejected) {
      this._onRejected = onRejected;
      switch (this._resolved) {
      case 1:
        if (!hasOnFullfiled) {
          promise._resolved = 1;
          promise._value = this._value;
        }
        break;
      case 2:
        push(callReject, this, this._value);
        break;
      }
    }
    return promise;
  }

  catch(onRejected) {
    const promise = new Promise(noop);
    let errorTypes;
    let i = -1;
    let l = arguments.length;
    let hasOnRejected = typeof onRejected === 'function';
    if (l > 1) {
      onRejected = arguments[--l];
      hasOnRejected = typeof onRejected === 'function';
      if (hasOnRejected) {
        errorTypes = Array(l);
        while (++i < l) {
          errorTypes[i] = arguments[i];
        }
        onRejected._errorTypes = errorTypes;
      }
    }
    if (this._receiver) {
      this._receivers = this._receivers || new Queue();
      this._receivers.push(promise);
      this._receivers.push(null);
      this._receivers.push(hasOnRejected ? onRejected : null);
      this._receivers.push(null);
      return promise;
    }
    this._receiver = promise;
    if (hasOnRejected) {
      this._onRejected = onRejected;
      switch (this._resolved) {
      case 1:
        promise._resolved = 1;
        promise._value = this._value;
        break;
      case 2:
        push(callReject, this, this._value);
        break;
      }
    }
    return promise;
  }

  finally(handler) {
    const promise = new Promise(noop);
    if (this._receiver) {
      this._receivers = this._receivers || new Queue();
      this._receivers.push(promise);
      this._receivers.push(null);
      this._receivers.push(null);
      this._receivers.push(handler);
      return promise;
    }
    this._receiver = promise;
    if (typeof handler === 'function') {
      this._finallyHandler = handler;
      switch (this._resolved) {
      case 1:
        push(callResolve, this, this._value);
        break;
      case 2:
        push(callReject, this, this._value);
        break;
      }
    }
    return promise;
  }

  // promise functions
  all() {
    return this.then(Promise.all);
  }
}

function resolve(value) {
  const p = new Promise(noop);
  p._resolved = 1;
  p._value = value;
  return p;
}

function reject(reason) {
  const p = new Promise(noop);
  p._resolved = 2;
  p._value = reason;
  return p;
}

// Classes
Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;
Promise.ReferenceError = ReferenceError;

// core functions
Promise.resolve = resolve;
Promise.reject = reject;


// collection functions
Promise.all = require('./all')(Promise);

// utility functions
Promise.promisify = require('./promisify')(Promise);

module.exports = Promise;
