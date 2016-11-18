'use strict';

const Queue = require('./internal/queue');
const { Receiver, InnerReceiver } = require('./internal/receiver');
const {
  errorObj,
  push,
  unshift,
  noop,
  internal,
  tryCatch
} = require('./internal/util');

class Promise {

  constructor(executor) {
    this._resolved = 0;
    this._value = undefined;
    this._receiver = undefined;
    this._receivers = undefined;
    this._callResolve = undefined;
    this._callReject = undefined;
    if (executor === internal) {
      return;
    }
    const callResolve = makeCallResolve(this);
    const callReject = makeCallReject(this);
    this._callResolve = callResolve;
    this._callReject = callReject;
    if (executor === noop) {
      return;
    }
    executor(callResolve, callReject);
  }

  toString() {
    return '[object Promise]';
  }

  then(onFullfilled, onRejected) {
    const promise = new Promise(noop);
    const hasOnFullfiled = typeof onFullfilled === 'function';
    const hasOnRejected = typeof onRejected === 'function';
    onFullfilled = hasOnFullfiled ? onFullfilled : undefined;
    onRejected = hasOnRejected ? onRejected : undefined;
    if (this._receiver) {
      this._receivers = this._receivers || new Queue();
      this._receivers.push(new Receiver(promise, onFullfilled, onRejected));
      return promise;
    }
    this._receiver = new Receiver(promise, onFullfilled, onRejected);
    if (hasOnFullfiled) {
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
      }
    }
    onRejected = hasOnRejected ? onRejected : undefined;
    if (this._receiver) {
      this._receivers = this._receivers || new Queue();
      this._receivers.push(new Receiver(promise, undefined, onRejected, errorTypes));
      return promise;
    }
    this._receiver = new Receiver(promise, undefined, onRejected, errorTypes);
    if (hasOnRejected) {
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
    handler = typeof handler === 'function' ? handler : undefined;
    if (this._receiver) {
      this._receivers = this._receivers || new Queue();
      this._receivers.push(new Receiver(promise, undefined, undefined, undefined, handler));
      return promise;
    }
    this._receiver = new Receiver(promise, undefined, undefined, undefined, handler);
    if (typeof handler === 'function') {
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

Promise.callResolve = callResolve;
Promise.callReject = callResolve;

// Classes
Promise.Promise = Promise;
Promise.TypeError = TypeError;
Promise.RangeError = RangeError;
Promise.ReferenceError = ReferenceError;

// core functions
Promise.resolve = resolve;
Promise.reject = reject;
Promise.join = require('./join')(Promise, callResolve, callReject);

// collection functions
Promise.all = require('./all')(Promise, callResolve, callReject);

// utility functions
Promise.promisify = require('./promisify')(Promise, callResolve, callReject);


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

function callResolves(receivers, value) {
  while (receivers.head) {
    const { promise, onFullfilled } = receivers.shift();
    if (onFullfilled === undefined) {
      continue;
    }
    const p = tryCatch(onFullfilled, value);
    if (p instanceof Promise) {
      switch (p._resolved) {
      case 0:
        p._receiver = new Receiver(promise);
        continue;
      case 1:
        callResolve(promise, p._value);
        continue;
      case 2:
        callReject(promise, p._value);
        continue;
      }
    }
    if (p === errorObj) {
      callReject(promise, p.e);
    } else if (p && p.then) {
      p.then(promise._callResolve, promise._callReject);
    } else {
      callResolve(promise, p);
    }
  }
}

function callResolve(promise, value) {
  while (promise) {
    if (promise._resolved === 0) {
      promise._resolved = 1;
      promise._value = value;
    }
    const { _receiver } = promise;
    if (!_receiver) {
      return;
    }
    if (_receiver instanceof InnerReceiver) {
      const { target, index } = _receiver;
      target.result[index] = value;
      if (--target.rest === 0) {
        value = target.result;
        promise = target.promise;
        continue;
      }
      return;
    }
    promise._receiver = undefined;
    if (_receiver.finallyHandler !== undefined) {
      return callFinally(_receiver, 1, value);
    }
    if (_receiver.onFullfilled === undefined) {
      promise = _receiver.promise;
      continue;
    }
    const p = tryCatch(_receiver.onFullfilled, value);
    if (promise._receivers) {
      const { _receivers } = promise;
      promise._receivers = undefined;
      callResolves(_receivers, value);
    }
    promise = _receiver.promise;
    if (p instanceof Promise) {
      switch (p._resolved) {
      case 0:
        p._receiver = new Receiver(promise);
        return;
      case 1:
        value = p._value;
        continue;
      case 2:
        return callReject(promise, p._value);
      }
    }
    if (p === errorObj) {
      return callReject(promise, p.e);
    }
    if (p && p.then) {
      return p.then(promise._callResolve, promise._callReject);
    }
    value = p;
  }
}

function callRejects(receivers, reason) {
  while (receivers.head) {
    const { promise, onRejected, errorTypes } = receivers.shift();
    if (onRejected === undefined) {
      continue;
    }
    if (errorTypes) {
      let l = errorTypes.length;
      let found = false;
      while (found === false && l--) {
        found = reason instanceof errorTypes[l];
      }
      if (found === false) {
        continue;
      }
    }
    const p = tryCatch(onRejected, reason);
    if (p instanceof Promise) {
      switch (p._resolved) {
      case 0:
        p._receiver = new Receiver(promise);
        continue;
      case 1:
        callResolve(promise, p._value);
        continue;
      case 2:
        callReject(promise, p._value);
        continue;
      }
    }
    if (p === errorObj) {
      callReject(promise, p.e);
    } else if (p && p.then) {
      p.then(promise._callResolve, promise._callReject);
    } else {
      callResolve(promise, p);
    }
  }
}

function callReject(promise, reason) {
  while (promise) {
    promise._resolved = 2;
    promise._value = reason;
    const { _receiver, _receivers } = promise;
    if (!_receiver) {
      break;
    }
    promise._receiver = undefined;
    const { finallyHandler, onRejected, errorTypes } = _receiver;
    if (finallyHandler !== undefined) {
      callFinally(_receiver, 2, reason);
      break;
    }
    if (onRejected === undefined) {
      promise = _receiver.promise;
      continue;
    }
    if (_receivers) {
      promise._receivers = undefined;
      callRejects(_receivers, reason);
    }
    promise = _receiver.promise;
    if (errorTypes) {
      let l = errorTypes.length;
      let found = false;
      while (found === false && l--) {
        found = reason instanceof errorTypes[l];
      }
      if (found === false) {
        continue;
      }
    }
    const p = tryCatch(onRejected, reason);
    if (p instanceof Promise) {
      switch (p._resolved) {
      case 0:
        p._receiver = new Receiver(promise);
        return;
      case 1:
        callResolve(promise, p._value);
        return;
      case 2:
        reason = p._value;
        continue;
      }
    }
    if (p === errorObj) {
      reason = p.e;
    } else if (p && p.then) {
      p.then(promise._callResolve, promise._callReject);
      break;
    } else {
      callResolve(promise, p);
      break;
    }
  }
  process.emit('unhandledRejection', reason);
}

function callFinally(receiver, resolved, value) {
  const { promise, finallyHandler } = receiver;
  const p = tryCatch(finallyHandler, value);
  if (p === errorObj) {
    callReject(promise, p.e);
  } else if (p && p.then) {
    p.then(() => callResolve(promise, value), promise._callReject);
  } else {
    switch (resolved) {
    case 1:
      callResolve(promise, value);
      break;
    case 2:
      callReject(promise, value);
      break;
    }
  }
}

function makeCallResolve(promise) {
  return value => unshift(callResolve, promise, value);
}

function makeCallReject(promise) {
  return reason => unshift(callReject, promise, reason);
}

module.exports = Promise;
