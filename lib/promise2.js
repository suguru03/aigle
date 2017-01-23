'use strict';

const Queue = require('./internal/queue');
const Task = require('./internal/task2');
const queue = new Queue();
const INTERNAL = () => {};

function execute(executor, resolve, reject) {
  try {
    executor(resolve, reject);
  } catch (e) {
    reject(e);
  }
}

let ticked = false;
function push(promise, receiver, onFullfilled, onRejected) {
  queue.push(new Task(promise, receiver, onFullfilled, onRejected));
  if (ticked) {
    return;
  }
  ticked = true;
  setImmediate(tick);
}

function tick() {
  while (queue.head) {
    const { promise, receiver, onFullfilled, onRejected } = queue.shift();
    switch (promise._resolved) {
    case 0:
      console.error('unhandled promise event');
      break;
    case 1:
      callResolve(receiver, onFullfilled, promise._value);
      break;
    case 2:
      callReject(receiver, onRejected, promise._value);
      break;
    }
  }
  ticked = false;
}

function callResolve(receiver, onFullfilled, value) {
  if (typeof onFullfilled !== 'function') {
    receiver._resolved = 1;
    receiver._value = value;
    receiver._resolve(value);
    return;
  }
  const promise = onFullfilled(value);
  if (promise instanceof Promise) {
    switch (promise._resolved) {
    case 0:
      promise._addPromise(receiver, receiver._callResolve, receiver._callReject);
      return;
    case 1:
      receiver._resolve(promise._value);
      return;
    case 2:
      receiver._reject(promise._value);
      return;
    }
  }
  if (promise && promise.then) {
    promise.then(receiver._callResolve, receiver._callReject);
  } else {
    receiver._resolve(promise);
  }
}

function callReject(receiver, onRejected, reason) {
  if (typeof onRejected !== 'function') {
    receiver._resolved = 2;
    receiver._value = reason;
    receiver._reject(reason);
    return;
  }
  const promise = onRejected(reason);
  if (promise instanceof Promise) {
    switch (promise._resolved) {
    case 0:
      promise._addPromise(receiver, receiver._callResolve, receiver._callReject);
      return;
    case 1:
      receiver._resolve(promise._value);
      return;
    case 2:
      receiver._reject(promise._value);
      return;
    }
  }
  if (promise && promise.then) {
    promise.then(receiver._callResolve, receiver._callReject);
  } else {
    receiver._resolve(promise);
  }
}

function makeCallResolve(promise) {
  return value => promise._resolve(value);
}

function makeCallReject(promise) {
  return reason => promise._reject(reason);
}

function createOnRejected(receiver, errorTypes, onRejected) {
  return reason => {
    let l = errorTypes.length;
    while (l--) {
      if (reason instanceof errorTypes[l]) {
        return onRejected(reason);
      }
    }
    receiver._reject(reason);
  };
}

function createFinallyHandler(promise, receiver, handler) {
  return value => {
    switch (promise._resolved) {
    case 0:
      console.error('unhandled finally events');
      return;
    case 1:
      if (typeof handler !== 'function') {
        receiver._resolved = 1;
        receiver._value = value;
        receiver._resolve(value);
        return;
      }
      const p1 = handler();
      if (p1 && p1.then) {
        p1.then(() => receiver._resolve(value), reason => receiver._reject(reason));
      } else {
        receiver._resolve(value);
      }
      return;
    case 2:
      if (typeof handler !== 'function') {
        receiver._resolved = 2;
        receiver._value = value;
        receiver._reject(value);
        return;
      }
      const p2 = handler();
      if (p2 && p2.then) {
        p2.then(() => receiver._reject(value), reason => receiver._reject(reason));
      } else {
        receiver._reject(value);
      }
    }
  };
}

class Promise {

  constructor(executor) {
    this._resolved = 0;
    this._length = 0;
    this._onFullFilled0 = undefined;
    this._onRejected0 = undefined;
    this._value = undefined;
    this._callResolve = makeCallResolve(this);
    this._callReject = makeCallReject(this);
    if (executor === INTERNAL) {
      return;
    }
    execute(executor, this._callResolve, this._callReject);
  }
  then(onFullfilled, onRejected) {
    const promise = new Promise(INTERNAL);
    if (this._resolved === 0) {
      this._addPromise(promise, onFullfilled, onRejected);
    } else {
      push(this, promise, onFullfilled, onRejected);
    }
    return promise;
  }
  catch(onRejected) {
    const promise = new Promise(INTERNAL);
    if (arguments.length > 1) {
      let l = arguments.length;
      onRejected = arguments[--l];
      const errorTypes = Array(l);
      while (l--) {
        errorTypes[l] = arguments[l];
      }
      onRejected = createOnRejected(promise, errorTypes, onRejected);
    }
    if (this._resolved === 0) {
      this._addPromise(promise, undefined, onRejected);
    } else {
      push(this, promise, undefined, onRejected);
    }
    return promise;
  }
  finally(handler) {
    const promise = new Promise(INTERNAL);
    handler = createFinallyHandler(this, promise, handler);
    if (this._resolved === 0) {
      this._addPromise(promise, handler, handler);
    } else {
      push(this, promise, handler, handler);
    }
    return promise;
  }
  _resolve(value) {
    this._resolved = 1;
    this._value = value;
    if (this._length === 0) {
      return;
    }
    let index = -1;
    while (++index < this._length) {
      callResolve(this[`_receiver${index}`], this[`_onFullFilled${index}`], value);
    }
    this._length = 0;
  }
  _reject(reason) {
    this._resolved = 2;
    this._value = reason;
    if (this._length === 0) {
      return;
    }
    let index = -1;
    while (++index < this._length) {
      callReject(this[`_receiver${index}`], this[`_onRejected${index}`], reason);
    }
    this._length = 0;
  }
  _addPromise(promise, onFullfilled, onRejected) {
    const index = this._length++;
    if (index === 0) {
      this._receiver0 = promise;
      this._onFullFilled0 = onFullfilled;
      this._onRejected0 = onRejected;
    } else {
      this[`_receiver${index}`] = promise;
      this[`_onFullFilled${index}`] = onFullfilled;
      this[`_onRejected${index}`] = onRejected;
    }
  }
}

Promise.resolve = resolve;
Promise.reject = reject;

function resolve(value) {
  const promise = new Promise(INTERNAL);
  promise._resolve(value);
  return promise;
}

function reject(reason) {
  const promise = new Promise(INTERNAL);
  promise._reject(reason);
  return promise;
}

module.exports = Promise;
