'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class DetectLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
  }

  _callResolve(value, index) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class DetectLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
  }

  _callResolve(value, index) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._resolve();
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { detectLimit, DetectLimitArray, DetectLimitObject };

function detectLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new DetectLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new DetectLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve();
}
