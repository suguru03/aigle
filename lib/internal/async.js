'use strict';

let ticked = false;
let len = 0;
const queue = Array(8);

function tick() {
  while (len !== 0) {
    const promise = queue[--len];
    queue[len] = undefined;
    promise._resolved === 1 ? promise._callResolve() : promise._callReject();
  }
  ticked = false;
}

function invoke(promise) {
  if (ticked === false) {
    setImmediate(tick);
    ticked = true;
  }
  queue[len++] = promise;
}

module.exports = invoke;
