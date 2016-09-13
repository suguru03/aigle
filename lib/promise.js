'use strict';

const util = require('./util');
const noop = util.noop;

class Promise {

  constructor(executor) {
    this._async = false;
    this._resolved = 0;
    this._value = undefined;
    this._child = null;
    this._errorTypes = null;
    this._onFullfilled = null;
    this._onRejected = null;
    this._finallyHandler = null;
    this._callResolve = makeCallResolve(this);
    this._callReject = makeCallReject(this);
    if (executor === noop) {
      return;
    }
    executor(this._callResolve, this._callReject);
    this._async = true;
  }

  toString() {
    return '[object Promise]';
  }

  _resume() {
    switch (this._resolved) {
    case 1:
      process.nextTick(() => this._child._resolve(this._value));
      break;
    case 2:
      process.nextTick(() => this._child._reject(this._value));
    }
  }

  then(onFullfilled, onRejected) {
    const p = new Promise(noop);
    p._onFullfilled = onFullfilled;
    p._onRejected = onRejected;
    p._async = this._async;
    this._child = p;
    this._resume();
    return p;
  }

  catch(onRejected) {
    const p = new Promise(noop);
    let l = arguments.length;
    if (l !== 1) {
      onRejected = arguments[--l];
      // TODO error handling
      if (typeof onRejected !== 'function') {
        return;
      }
      const errorTypes = Array(l);
      while (l--) {
        errorTypes[l] = arguments[l];
      }
      p._errorTypes = errorTypes;
    }
    p._onRejected = onRejected;
    p._async = this._async;
    this._child = p;
    this._resume();
    return p;
  }

  finally(handler) {
    const p = new Promise(noop);
    p._finallyHandler = handler;
    p._async = this._async;
    this._child = p;
    this._resume();
    return p;
  }

  all() {
    return this.then(Promise.all);
  }

  race() {
    return this.then(Promise.race);
  }

  each(iterator) {
    return this.then(value => Promise.each(value, iterator));
  }


  _resolve(value) {
    if (this._finallyHandler) {
      return this._finally(value, 1);
    }
    const task = this._onFullfilled;
    const child = this._child;
    if (!task) {
      this._resolved = 1;
      this._value = value;
      return child && child._resolve(value);
    }
    const p = task(value);
    if (p && p.then) {
      p.then(this._callResolve, this._callReject);
    } else {
      this._resolved = 1;
      this._value = p;
      return child && child._resolve(p);
    }
  }

  _reject(reason) {
    if (this._finallyHandler) {
      return this._finally(reason, 2);
    }
    const task = this._onRejected;
    const child = this._child;
    if (!task) {
      this._resolved = 2;
      this._value = reason;
      return child && child._reject(reason);
    }
    const errorTypes = this._errorTypes;
    if (errorTypes) {
      let l = errorTypes.length;
      let found = false;
      while (found === false && l--) {
        found = reason instanceof errorTypes[l];
      }
      if (found === false) {
        this._resolve = 2;
        this._value = reason;
        return child && child._reject(reason);
      }
    }
    const p = task(reason);
    if (p && p.then) {
      p.then(this._callResolve, this._callReject);
    } else {
      this._resolved = 1;
      this._value = p;
      return child && child._resolve(p);
    }
  }

  _finally(value, resolved) {
    const task = this._finallyHandler;
    const child = this._child;
    const p = task();
    if (p && p.then) {
      p.then(() => {
        this._resolved = resolved;
        this._value = value;
        return child && child._resolve(value);
      }, this._callReject);
    } else {
      this._resolved = resolved;
      this._value = value;
      return child && child._resolve(value);
    }
  }
}

// Classes
Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

// native functions
Promise.resolve = resolve;
Promise.reject = reject;
Promise.all = require('./all')(Promise);
Promise.race = require('./race')(Promise);

// async style functions
Promise.each = require('./each')(Promise);
Promise.forEach = Promise.each;

// utility functions
Promise.promisify = require('./promisify')(Promise);

function makeCallResolve(promise) {
  return value => {
    if (promise._async) {
      promise._resolved = 1;
      promise._value = value;
      return promise._child && promise._child._resolve(value);
    }
    process.nextTick(() => {
      promise._resolved = 1;
      promise._value = value;
      return promise._child && promise._child._resolve(value);
    });
  };
}

function makeCallReject(promise) {
  return reason => {
    if (promise._async) {
      promise._resolved = 2;
      promise._value = reason;
      return promise._child && promise._child._reject(reason);
    }
    process.nextTick(() => {
      promise._resolved = 2;
      promise._value = reason;
      return promise._child && promise._child._reject(reason);
    });
  };
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

module.exports = Promise;
