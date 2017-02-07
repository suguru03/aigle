'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class OmitArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
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
    }
  }
}

class OmitObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
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
    }
  }
}

module.exports = omit;

function omit(collection, iterator) {
  if (Array.isArray(collection)) {
    return new OmitArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new OmitObject(collection, iterator)._iterate();
  }
  return Aigle.resolve({});
}
