'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class OmitLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (!value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class OmitLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(value, index) {
    if (!value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { omitLimit, OmitLimitArray, OmitLimitObject };

function omitLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new OmitLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new OmitLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve({});
}
