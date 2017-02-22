'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class SomeArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = false;
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  }
}

class SomeObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = false;
  }

  _callResolve(value) {
    if (this._promise._resolved !== 0) {
      return;
    }
    if (value) {
      this._promise._resolve(true);
    } else if (--this._rest === 0) {
      this._promise._resolve(false);
    }
  }
}

module.exports = some;

function some(collection, iterator) {
  if (Array.isArray(collection)) {
    return new SomeArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SomeObject(collection, iterator)._iterate();
  }
  return Aigle.resolve(false);
}
