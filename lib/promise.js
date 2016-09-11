'use strict';

const util = require('./util');
const noop = util.noop;

class Promise {

  constructor(executor) {
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
  }

  toString() {
    return '[object Promise]';
  }

  _resume() {
    switch (this._resolved) {
    case 1:
      process.nextTick(() => {
        return this._child._resolve(this._value);
      });
      break;
    case 2:
      process.nextTick(() => {
        return this._child._reject(this._value);
      });
    }
  }

  then(onFullfilled, onRejected) {
    const p = new Promise(noop);
    p._onFullfilled = onFullfilled;
    p._onRejected = onRejected;
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
    this._child = p;
    this._resume();
    return p;
  }

  finally(handler) {
    const p = new Promise(noop);
    p._finallyHandler = handler;
    this._child = p;
    this._resume();
    return p;
  }

  all() {
    return this.then(Promise.all);
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
        const child = self._child;
        return child && child._resolve(value);
      }, this._callReject);
    } else {
      this._resolved = resolved;
      this._value = value;
      return child && child._resolve(value);
    }
  }
}

Promise.resolve = resolve;
Promise.reject = reject;
Promise.all = require('./all')(Promise);

Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

function makeCallResolve(self) {
  return value => {
    process.nextTick(() => {
      self._resolved = 1;
      self._value = value;
      const child = self._child;
      return child && child._resolve(value);
    });
  };
}

function makeCallReject(self) {
  return reason => {
    process.nextTick(() => {
      self._resolved = 2;
      self._value = reason;
      const child = self._child;
      return child && child._reject(reason);
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
