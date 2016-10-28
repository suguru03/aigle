'use strict';

const Queue = require('./queue');
const Task = require('./task');
const queue = new Queue();
const errorObj = { e: undefined };

module.exports = {
  errorObj,
  push,
  unshift,
  noop,
  internal,
  tryCatch,
  tryCatchWithKey
};

let ticked = false;

function tick() {
  while (queue.head) {
    const { func, promise, value } = queue.shift();
    func(promise, value);
  }
  ticked = false;
}

function push(func, promise, value) {
  queue.push(new Task(func, promise, value));
  if (ticked) {
    return;
  }
  ticked = true;
  setImmediate(tick);
}

function unshift(func, promise, value) {
  queue.unshift(new Task(func, promise, value));
  if (ticked) {
    return;
  }
  ticked = true;
  setImmediate(tick);
}

function noop() {}
function internal() {}

function tryCatch(func, value) {
  try {
    return func(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function tryCatchWithKey(func, value, key) {
  try {
    return func(value, key);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}
