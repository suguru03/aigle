'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, compactArray } = require('./internal/util');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class RejectArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._array[index];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

class RejectObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value ? INTERNAL : this._object[this._keys[index]];
    if (--this._rest === 0) {
      this._promise._resolve(compactArray(this._result));
    }
  }
}

module.exports = reject;

function reject(collection, iterator) {
  if (Array.isArray(collection)) {
    return new RejectArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new RejectObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}
