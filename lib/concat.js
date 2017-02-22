'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class ConcatArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = [];
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

class ConcatObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = [];
  }

  _callResolve(value) {
    if (Array.isArray(value)) {
      this._result.push(...value);
    } else {
      this._result.push(value);
    }
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }
}

module.exports = concat;

function concat(collection, iterator) {
  if (Array.isArray(collection)) {
    return new ConcatArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new ConcatObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}
