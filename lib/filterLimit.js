'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class filterLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._array[index] : INTERNAL;
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class filterLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? this._object[this._keys[index]] : INTERNAL;
    if (--this._rest === 0) {
      this._resolve(compactArray(this._result));
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { filterLimit, filterLimitArray, filterLimitObject };

function filterLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new filterLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new filterLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve();
}
