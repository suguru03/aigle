'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class EveryArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
    }
  }
}

class EveryObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    if (this._rest === 0) {
      this._value = true;
    }
  }

  _callResolve(value) {
    if (this._resolved !== 0) {
      return;
    }
    if (!value) {
      this._resolve(false);
    } else if (--this._rest === 0) {
      this._resolve(true);
    }
  }
}

module.exports = every;

function every(collection, iterator) {
  if (Array.isArray(collection)) {
    return new EveryArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new EveryObject(collection, iterator)._iterate();
  }
  return Aigle.resolve(true);
}
