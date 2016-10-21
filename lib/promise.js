'use strict';

const util = require('./internal/util');
const noop = util.noop;
const errorObj = util.errorObj;
const tryCatch = util.tryCatch;

function callResolve(promise, value) {
  while (promise) {
    const { _finallyHandler, _onFullfilled, _receiver } = promise;
    if (_finallyHandler !== undefined) {
      callFinally(promise, 1, value);
      break;
    }
    promise._resolved = 1;
    promise._value = value;
    if (_onFullfilled === undefined) {
      promise = _receiver;
      continue;
    }
    const p = tryCatch(_onFullfilled, value);
    if (p === errorObj) {
      callReject(_receiver, p.e);
      break;
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
    const { _finallyHandler, _onRejected, _receiver, _errorTypes } = promise;
    if (_finallyHandler !== undefined) {
      callFinally(promise, 2, reason);
      return;
    }
    promise._resolved = 2;
    promise._value = reason;
    if (_onRejected === undefined) {
      promise = _receiver;
      continue;
    }
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
      return;
    } else {
      callResolve(_receiver, p);
      return;
    }
  }
  process.emit('unhandledRejection', reason);
}

function callFinally(promise, resolved, value) {
  promise._resolved = resolved;
  promise._value = value;
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
      setImmediate(() => callResolve(promise, value));
    }
  };
}

function makeCallReject(promise) {
  return reason => {
    if (promise._async) {
      callReject(promise, reason);
    } else {
      setImmediate(() => callReject(promise, reason));
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
    this._onFullfilled = undefined;
    this._onRejected = undefined;
    this._errorTypes = undefined;
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
    this._receiver = promise;
    const hasOnFullfiled = typeof onFullfilled === 'function';
    const hasOnRejected = typeof onRejected === 'function';
    if (hasOnFullfiled) {
      this._onFullfilled = onFullfilled;
      switch (this._resolved) {
      case 1:
        setImmediate(() => callResolve(this, this._value));
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
        setImmediate(() => callReject(this, this._value));
        break;
      }
    }
    return promise;
  }

  catch(onRejected) {
    const promise = new Promise(noop);
    this._receiver = promise;
    let errorTypes;
    let i = -1;
    let l = arguments.length;
    if (l > 1) {
      onRejected = arguments[--l];
      errorTypes = Array(l);
      while (++i < l) {
        errorTypes[i] = arguments[i];
      }
      this._errorTypes = errorTypes;
    }
    if (typeof onRejected === 'function') {
      this._onRejected = onRejected;
      switch (this._resolved) {
      case 1:
        promise._resolved = 1;
        promise._value = this._value;
        break;
      case 2:
        setImmediate(() => callReject(this, this._value));
        break;
      }
    }
    return promise;
  }

  finally(handler) {
    const promise = new Promise(noop);
    this._receiver = promise;
    if (typeof handler === 'function') {
      this._finallyHandler = handler;
      if (this._resolved !== 0) {
        setImmediate(() => callFinally(this, this._resolved, this._value));
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

module.exports = Promise;
