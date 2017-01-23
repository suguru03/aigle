'use strict';

const Queue = require('./internal/queue');
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
  queue.push(promise);
  queue.push(receiver);
  queue.push(onFullfilled);
  queue.push(onRejected);
  if (ticked) {
    return;
  }
  ticked = true;
  setImmediate(tick);
}

function tick() {
  while (queue.head) {
    const promise = queue.shift();
    const receiver = queue.shift();
    const onFullfilled = queue.shift();
    const onRejected = queue.shift();
    callFullFilled(receiver, onFullfilled, promise._value);
  }
  ticked = false;
}

function callFullFilled(receiver, onFullfilled, value) {
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

function makeCallResolve(promise) {
  return value => promise._resolve(value);
}

function makeCallReject(promise) {
  return reason => promise._reject(reason);
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
    if (this._resolved === 0) {
      this._addPromise(promise, undefined, onRejected);
    } else {
      push(this, promise, undefined, onRejected);
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
      callFullFilled(this[`_receiver${index}`], this[`_onFullFilled${index}`], value);
    }
    this._length = 0;
  }
  _reject(reason) {
    this._resolved = 1;
    this._value = reason;
    if (this._length === 0) {
      return;
    }
    let i = -1;
    while (++i < this._length) {
      this[`_onRejected${i}`](reason);
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

module.exports = Promise;
