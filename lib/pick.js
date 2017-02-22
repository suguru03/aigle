'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class PickArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (value) {
      this._result[index] = this._array[index];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class PickObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = {};
  }

  _callResolve(value, index) {
    if (value) {
      const key = this._keys[index];
      this._result[key] = this._object[key];
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

module.exports = pick;

function pick(collection, iterator) {
  if (Array.isArray(collection)) {
    return new PickArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new PickObject(collection, iterator)._iterate();
  }
  return Aigle.resolve({});
}
