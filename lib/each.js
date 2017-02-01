'use strict';

const { AigleProxy } = require('./aigle');
const { arrayEach, baseEach } = require('./internal/util');

class Each extends AigleProxy {

  constructor() {
    super();
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

module.exports = each;

function each(collection, iterator) {
  const promise = new Each();
  if (Array.isArray(collection)) {
    arrayEach(promise, collection, iterator);
  } else if (collection && typeof collection === 'object') {
    baseEach(promise, collection, iterator);
  } else {
    promise._resolve();
  }
  return promise;
}
