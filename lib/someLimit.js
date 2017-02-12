'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class SomeLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(true);
    } else if (--this._rest === 0) {
      this._resolve(false);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class SomeLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(true);
    } else if (--this._rest === 0) {
      this._resolve(false);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = someLimit;

function someLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new SomeLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SomeLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve();
}
