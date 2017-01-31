'use strict';

const { AigleProxy } = require('./aigle');
const { arrayEach, baseEach } = require('./internal/util');

class Each extends AigleProxy {

  constructor(iterator) {
    super();
    this._iterator = iterator;
    this._rest = undefined;
    this._result = undefined;
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

module.exports = each;

function each(collection, iterator) {
  const promise = new Each(iterator);
  if (Array.isArray(collection)) {
    arrayEach(promise, collection, iterator);
  } else if (collection && typeof collection === 'object') {
    baseEach(promise, collection, iterator);
  } else {
    promise._resolve();
  }
  return promise;
}
