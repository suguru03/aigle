'use strict';

const util = require('./internal/util');
const Queue = require('./internal/queue');
const noop = util.noop;
const concurrency = util.concurrency;
const errorObj = util.errorObj;
const tryCatch = util.tryCatch;

class Promise {

  constructor(executor) {
    this._async = false;
    this._concurrency = concurrency;
    this._resolved = 0;
    this._value = undefined;
    this._errorTypes = null;
    this._onFullfilled = null;
    this._onRejected = null;
    this._finallyHandler = null;
    this._childlen = new Queue();
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
    const childlen = this._childlen;
    if (!childlen._head) {
      if (this._resolved === 2) {
        process.emit('unhandledRejection', this._value);
      }
      return;
    }
    let child;
    const value = this._value;
    switch (this._resolved) {
    case 1:
      while (child = childlen.shift()) {
        child._resolve(value);
      }
      break;
    case 2:
      while (child = childlen.shift()) {
        child._reject(value);
      }
      break;
    default:
      return;
    }
    this._async = false;
  }

  then(onFullfilled, onRejected) {
    const p = new Promise(noop);
    p._onFullfilled = onFullfilled;
    p._onRejected = onRejected;
    p._async = this._async;
    this._childlen.push(p);
    if (this._resolved !== 0) {
      this._async ? this._resume() : process.nextTick(() => this._resume());
    }
    return p;
  }

  catch(onRejected) {
    const p = new Promise(noop);
    let l = arguments.length;
    if (l > 1) {
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
    p._concurrency = this._concurrency;
    this._childlen.push(p);
    if (this._resolved !== 0) {
      this._async ? this._resume() : process.nextTick(() => this._resume());
    }
    return p;
  }

  finally(handler) {
    const p = new Promise(noop);
    if (typeof handler === 'function') {
      p._finallyHandler = handler;
    }
    p._async = this._async;
    this._childlen.push(p);
    if (this._resolved !== 0) {
      this._async ? this._resume() : process.nextTick(() => this._resume());
    }
    return p;
  }

  // native functions

  all() {
    return this.then(Promise.all);
  }

  race() {
    return this.then(Promise.race);
  }

  // collections

  concurrency(n) {
    this._concurrency = n;
    return this;
  }
  each(iterator) {
    return this.then(value => Promise.each(value, iterator));
  }

  eachSeries(iterator) {
    return this.then(value => Promise.eachSeries(value, iterator));
  }

  eachLimit(n, iterator) {
    if (arguments.length === 1) {
      iterator = n;
      n = this._concurrency;
    }
    return this.then(value => Promise.eachLimit(value, n, iterator));
  }

  // inner functions

  _resolve(value) {
    if (this._finallyHandler) {
      return this._finally(value, 1);
    }
    const task = this._onFullfilled;
    if (typeof task !== 'function') {
      this._resolved = 1;
      this._value = value;
      return this._resume();
    }
    const p = tryCatch(task, value);
    if (p === errorObj) {
      this._resolved = 2;
      this._value = p.e;
      return this._resume();
    }
    if (p && p.then) {
      p.then(this._callResolve, this._callReject);
    } else {
      this._resolved = 1;
      this._value = p;
      return this._resume();
    }
  }

  _reject(reason) {
    if (this._finallyHandler) {
      return this._finally(reason, 2);
    }
    const task = this._onRejected;
    if (typeof task !== 'function') {
      this._resolved = 2;
      this._value = reason;
      return this._resume();
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
        return this._resume();
      }
    }
    const p = tryCatch(task, reason);
    if (p === errorObj) {
      this._resolved = 2;
      this._value = p.e;
      return this._resume();
    }
    if (p && p.then) {
      p.then(this._callResolve, this._callReject);
    } else {
      this._resolved = 1;
      this._value = p;
      return this._resume();
    }
  }

  _finally(value, resolved) {
    const task = this._finallyHandler;
    const p = tryCatch(task);
    if (p === errorObj) {
      this._resolved = 2;
      this._value = p.e;
      return this._resume();
    }
    if (p && p.then) {
      p.then(() => {
        this._resolved = resolved;
        this._value = value;
        return this._resume();
      }, this._callReject);
    } else {
      this._resolved = resolved;
      this._value = value;
      return this._resume();
    }
  }
}

// Classes
Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

// core functions
Promise.resolve = resolve;
Promise.reject = reject;
Promise.join = require('./join')(Promise);

// collection functions
Promise.all = require('./all')(Promise);
Promise.race = require('./race')(Promise);
Promise.each = require('./each')(Promise);
Promise.forEach = Promise.each;
Promise.eachSeries = require('./eachSeries')(Promise);
Promise.forEachSeries = Promise.forEach;
Promise.eachLimit = require('./eachLimit')(Promise);
Promise.forEachLimit = Promise.eachLimit;

// utility functions
Promise.promisify = require('./promisify')(Promise);

function makeCallResolve(promise) {
  return value => {
    if (promise._async) {
      promise._resolved = 1;
      promise._value = value;
      return promise._resume();
    }
    process.nextTick(() => {
      promise._resolved = 1;
      promise._value = value;
      return promise._resume();
    });
  };
}

function makeCallReject(promise) {
  return reason => {
    if (promise._async) {
      promise._resolved = 2;
      promise._value = reason;
      return promise._resume();
    }
    process.nextTick(() => {
      promise._resolved = 2;
      promise._value = reason;
      return promise._resume();
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
