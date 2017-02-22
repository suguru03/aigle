'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');
const { sort } = require('./internal/util');

class SortByLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = { criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class SortByLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    if (this._promise._resolved !== 0) {
      return;
    }
    this._result[index] = { criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = sortByLimit;

function sortByLimit(collection, limit, iterator) {
  if (typeof limit === 'function') {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new SortByLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SortByLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve([]);
}
