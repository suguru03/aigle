'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class MapArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

class MapObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    const { _rest } = this;
    if (_rest === 0) {
      this._value = [];
    } else {
      this._result = Array(_rest);
    }
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = map;

function map(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}
