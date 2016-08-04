'use strict';

const noop = function() {};

class Promise {

  constructor(executor) {
    this._child = undefined;
    this._onFullfilled = undefined;
    this._onRejected = undefined;
    this._errorTypes = undefined;
    this._finally = undefined;

    this._value = undefined;
    this._result = undefined;
    this._resolved = 0;
    this._callResolve = callResolve.bind(this);
    this._callReject = callReject.bind(this);
    this._callFinally = callFinally.bind(this);
    if (executor === noop) {
      return;
    }
    executor(this._callResolve, this._callReject);
  }

  toString() {
    return '[object Promise]';
  }

  then(onFullfilled, onRejected) {
    this._onFullfilled = onFullfilled;
    this._onRejected = onRejected;
    const p = new Promise(noop);
    this._child = p;
    this._resume();
    return p;
  }

  catch(onRejected) {
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
      this._errorTypes = errorTypes;
    }
    this._onRejected = onRejected;
    const p = new Promise(noop);
    this._child = p;
    this._resume();
    return p;
  }

  finally(handler) {
    this._finally = handler;
    const p = new Promise(noop);
    this._child = p;
    this._resume();
    return p;
  }

  all() {
    const p = all(this._value);
    this._resume();
    return p;
  }

  _resume() {
    switch (this._resolved) {
    case 0:
      return this;
    case 1:
      this._resolved = 0;
      this._resolve();
      return this;
    case 2:
      this._resolved = 0;
      this._reject();
      return this;
    }
  }

  _resolve() {
    this._resolved = 1;
    const task = this._onFullfilled;
    const child = this._child;
    if (task) {
      const p = task(this._value);
      if (p instanceof Promise) {
        p._onFullfilled = child._callResolve;
        p._onRejected = child._callReject;
        p._resume();
        return;
      }
      if (p && p.then) {
        p.then(child._callResolve, child._callReject);
        return;
      }
      this._value = p;
    }
    const finallyTask = this._finally;
    if (finallyTask) {
      const p = finallyTask();
      if (p && p.then) {
        p.then(child._callFinally, child._callReject);
        return;
      }
    }
    if (child) {
      child._value = this._value;
      child._resolve();
    }
  }

  _reject() {
    this._resolved = 2;
    const task = this._onRejected;
    const child = this._child;
    if (task) {
      const errorTypes = this._errorTypes;
      if (errorTypes) {
        let l = errorTypes.length;
        let found = false;
        while (!found && l--) {
          found = this._value instanceof errorTypes[l];
        }
        if (!found) {
          child._value = this._value;
          return child._reject();
        }
      }
      const p = task(this._value);
      if (p && p.then) {
        p.then(child._callResolve, child._callReject);
        return;
      }
      this._value = p;
      this._resolved = 1;
    }
    const finallyTask = this._finally;
    if (finallyTask) {
      this._finally = undefined;
      const p = finallyTask();
      if (p && p.then) {
        p.then(this._callFinally, this._callReject);
        return;
      }
    }
    if (child) {
      child._value = this._value;
      if (this._resolved === 1) {
        child._resolve();
      } else {
        child._reject();
      }
    }
  }
}

function callResolve(value) {
  this._value = value;
  this._resolve();
  return value;
}

function callReject(reason) {
  this._value = reason;
  this._reject();
  return reason;
}

function callFinally() {
  this._resolve();
}

function resolve(value) {
  return new Promise(function(resolve) {
    resolve(value);
  });
}

function reject(reason) {
  return new Promise(function(resolve, reject) {
    reject(reason);
  });
}

const all = require('./all')(Promise);

Promise.resolve = resolve;
Promise.reject = reject;

Promise.all = all;

Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

module.exports = Promise;
