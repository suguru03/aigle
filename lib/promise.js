'use strict';

class Promise {

  constructor(executor) {
    this._resolved = 0;
    this._value = undefined;
    this._child = null;
    this._errorTypes = null;
    this._onFullfilled = null;
    this._onRejected = null;
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
    case 0:
      return;
    case 1:
      return this._child._resolve(this._value);
    case 2:
      return this._child._reject(this._value);
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

  _resolve(value) {
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
}

Promise.resolve = resolve;
Promise.reject = reject;

Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

function noop() {}

function makeCallResolve(self) {
  return value => {
    setImmediate(() => {
      self._resolved = 1;
      self._value = value;
      const child = self._child;
      return child && child._resolve(value);
    });
  };
}
function makeCallReject(self) {
  return reason => {
    setImmediate(() => {
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
