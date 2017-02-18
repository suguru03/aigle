'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class EveryLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class EveryLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = everyLimit;

function everyLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new EveryLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new EveryLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve(true);
}
