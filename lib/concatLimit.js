'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class ConcatLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = [];
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class ConcatLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = [];
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = concatLimit;

function concatLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new ConcatLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new ConcatLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}
