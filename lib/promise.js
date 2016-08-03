'use strict';

var noop = function() {};

function Promise(executor) {
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

Promise.prototype.toString = function() {
  return '[object Promise]';
};

Promise.prototype.then = function(onFullfilled, onRejected) {
  this._onFullfilled = onFullfilled;
  this._onRejected = onRejected;
  var p = new Promise(noop);
  this._child = p;
  this._resume();
  return p;
};

Promise.prototype.catch = function(onRejected) {
  var l = arguments.length;
  if (l !== 1) {
    onRejected = arguments[--l];
    // TODO error handling
    if (typeof onRejected !== 'function') {
      return;
    }
    var errorTypes = Array(l);
    while (l--) {
      errorTypes[l] = arguments[l];
    }
    this._errorTypes = errorTypes;
  }
  this._onRejected = onRejected;
  var p = new Promise(noop);
  this._child = p;
  this._resume();
  return p;
};

Promise.prototype.finally = function(handler) {
  this._finally = handler;
  var p = new Promise(noop);
  this._child = p;
  this._resume();
  return p;
};

Promise.prototype.all = function() {
  var p = all(this._value);
  this._resume();
  return p;
};

Promise.prototype._resume = function() {
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
};

Promise.prototype._resolve = function() {
  this._resolved = 1;
  var task = this._onFullfilled;
  var child = this._child;
  if (task) {
    var p = task(this._value);
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
  var finallyTask = this._finally;
  if (finallyTask) {
    var p = finallyTask();
    if (p && p.then) {
      p.then(child._callFinally, child._callReject);
      return;
    }
  }
  if (child) {
    child._value = this._value;
    child._resolve();
  }
};

Promise.prototype._reject = function() {
  this._resolved = 2;
  var task = this._onRejected;
  var child = this._child;
  if (task) {
    var errorTypes = this._errorTypes;
    if (errorTypes) {
      var l = errorTypes.length;
      var found = false;
      while (!found && l--) {
        found = this._value instanceof errorTypes[l];
      }
      if (!found) {
        child._value = this._value;
        return child._reject();
      }
    }
    var p = task(this._value);
    if (p && p.then) {
      p.then(child._callResolve, child._callReject);
      return;
    }
    this._value = p;
    this._resolved = 1;
  }
  var finallyTask = this._finally;
  if (finallyTask) {
    this._finally = undefined;
    var p = finallyTask();
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
};

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

var all = require('./all')(Promise);

Promise.resolve = resolve;
Promise.reject = reject;

Promise.all = all;

Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

module.exports = Promise;
