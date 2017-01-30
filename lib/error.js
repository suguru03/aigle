'use strict';

const types = ['TimeoutError'];
let l = types.length;
while (l--) {
  exports[types[l]] = class extends Error {
    constructor(message) {
      super(message);
    }
  };
}
