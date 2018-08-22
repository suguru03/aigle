'use strict';

const types = ['CancellationError', 'TimeoutError'];
let l = types.length;
while (l--) {
  const name = types[l];
  const Class = class extends Error {};
  Class.prototype.name = name;
  exports[name] = Class;
}
