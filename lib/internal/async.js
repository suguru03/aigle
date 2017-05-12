'use strict';

let ticked = false;
let len = 0;
const queue = Array(8);

function tick() {
  let i = -1;
  while (++i < len) {
    const promise = queue[i];
    queue[i] = undefined;
    promise._resolved === 1 ? promise._callResolve() : promise._callReject();
  }
  ticked = false;
  len = 0;
}

function invoke(promise) {
  if (ticked === false) {
    setImmediate(tick);
    ticked = true;
  }
  queue[len++] = promise;
}

module.exports = invoke;
