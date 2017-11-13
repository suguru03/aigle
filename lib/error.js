'use strict';

const types = [
  'CancellationError',
  'TimeoutError'
];
let l = types.length;
while (l--) {
  exports[types[l]] = class extends Error {};
}
