'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class FilterLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class FilterLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { filterLimit, FilterLimitArray, FilterLimitObject };

function filterLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new FilterLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FilterLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}
