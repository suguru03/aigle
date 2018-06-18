'use strict';

const queue = Array(8);
let len = 0;
let ticked = false;

const { supportAsyncHook } = require('./util');
const AsyncResource = supportAsyncHook && require('async_hooks').AsyncResource;

module.exports = Object.assign(exports, { invoke, AsyncResource });

function tick() {
  let i = -1;
  while (++i < len) {
    const promise = queue[i];
    queue[i] = undefined;
    switch (promise._resolved) {
      case 1:
        promise._callResolve();
        break;
      case 2:
        promise._callReject();
        break;
    }
  }
  len = 0;
  ticked = false;
}

function invoke(promise) {
  if (ticked === false) {
    setImmediate(tick);
    ticked = true;
  }
  queue[len++] = promise;
}
