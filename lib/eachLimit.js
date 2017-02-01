'use strict';

const { Aigle } = require('./aigle');
const {
  DEFAULT_LIMIT,
  AigleLimitArray,
  AigleLimitObject
} = require('./internal/aigleLimit');

class EachLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._iterate();
    }
  }
}

class EachLimitObject extends AigleLimitObject {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._iterate();
    }
  }
}

module.exports = eachLimit;

function eachLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new EachLimitArray(collection, iterator, limit);
  }
  if (collection && typeof collection === 'object') {
    return new EachLimitObject(collection, iterator, limit);
  }
  return Aigle.resolve();
}

