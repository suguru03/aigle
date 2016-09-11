'use strict';

var noop = function() {};

function makeCallResolve(self) {
  return function callResolve(value) {
    setImmediate(function() {
      self._resolved = 1;
      self._value = value;
      var child = self._child;
      return child && child._resolve(value);
    });
  };
}
function makeCallReject(self) {
  return function callReject(reason) {
    setImmediate(function() {
      self._resolved = 2;
      self._value = reason;
      var child = self._child;
      return child && child._reject(reason);
    });
  };
}

function Promise(executor) {
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

Promise.prototype.toString = function() {
  return '[object Promise]';
};

Promise.prototype._resume = function() {
  switch (this._resolved) {
  case 0:
    return;
  case 1:
    return this._child._resolve(this._value);
  case 2:
    return this._child._reject(this._value);
  }
};

Promise.prototype.then = function(onFullfilled, onRejected) {
  var p = new Promise(noop);
  p._onFullfilled = onFullfilled;
  p._onRejected = onRejected;
  this._child = p;
  this._resume();
  return p;
};

Promise.prototype.catch = function(onRejected) {
  var p = new Promise(noop);
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
    p._errorTypes = errorTypes;
  }
  p._onRejected = onRejected;
  this._child = p;
  this._resume();
  return p;
};

Promise.prototype._resolve = function(value) {
  var task = this._onFullfilled;
  var child = this._child;
  if (!task) {
    this._resolved = 1;
    this._value = value;
    return child && child._resolve(value);
  }
  var p = task(value);
  if (p && p.then) {
    p.then(this._callResolve, this._callReject);
  } else {
    this._resolved = 1;
    this._value = p;
    return child && child._resolve(p);
  }
};

Promise.prototype._reject = function(reason) {
  var task = this._onRejected;
  var child = this._child;
  if (!task) {
    this._resolve = 2;
    this._value = reason;
    return child && child._reject(reason);
  }
  var errorTypes = this._errorTypes;
  if (errorTypes) {
    var l = errorTypes.length;
    var found = false;
    while (found === false && l--) {
      found = reason instanceof errorTypes[l];
    }
    if (found === false) {
      this._resolve = 2;
      this._value = reason;
      return child && child._reject(reason);
    }
  }
  var p = task(reason);
  if (p && p.then) {
    p.then(this._callResolve, this._callReject);
  } else {
    this._resolved = 1;
    this._value = p;
    return child && child._resolve(p);
  }
};


Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;

module.exports = Promise;
