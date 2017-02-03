'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class MapValuesLimitArray extends AigleLimitArray {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class MapValuesLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    this._result = {};
  }

  _callResolve(value, index) {
    this._result[this._keys[index]] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = { mapValuesLimit, MapValuesLimitArray, MapValuesLimitObject };

function mapValuesLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new MapValuesLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapValuesLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve();
}

