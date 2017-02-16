'use strict';

const { Aigle } = require('./aigle');
const { DEFAULT_LIMIT, AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class GroupByLimitArray extends AigleLimitArray {

  constructor(array, iterator, limit) {
    super(array, iterator, limit);
    if (this._rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(key, index) {
    if (this._result[key]) {
      this._result[key].push(this._array[index]);
    } else {
      this._result[key] = [this._array[index]];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size && this._resolved === 0) {
      this._next();
    }
  }
}
class GroupByLimitObject extends AigleLimitObject {

  constructor(object, iterator, limit) {
    super(object, iterator, limit);
    if (this._rest === 0) {
      this._value = {};
    } else {
      this._result = {};
    }
  }

  _callResolve(key, index) {
    if (this._result[key]) {
      this._result[key].push(this._object[this._keys[index]]);
    } else {
      this._result[key] = [this._object[this._keys[index]]];
    }
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size && this._resolved === 0) {
      this._next();
    }
  }
}

module.exports = groupByLimit;

function groupByLimit(collection, limit, iterator) {
  if (arguments.length === 2) {
    iterator = limit;
    limit = DEFAULT_LIMIT;
  }
  if (Array.isArray(collection)) {
    return new GroupByLimitArray(collection, iterator, limit)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new GroupByLimitObject(collection, iterator, limit)._iterate();
  }
  return Aigle.resolve({});
}
