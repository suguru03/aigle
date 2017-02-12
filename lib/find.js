'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class FindArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
  }

  _callResolve(value, index) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._array[index]);
    } else if (--this._rest === 0) {
      this._resolve();
    }
  }
}

class FindObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
  }

  _callResolve(value, index) {
    if (this._resolved !== 0) {
      return;
    }
    if (value) {
      this._resolve(this._object[this._keys[index]]);
    } else if (--this._rest === 0) {
      this._resolve();
    }
  }
}

module.exports = find;

function find(collection, iterator) {
  if (Array.isArray(collection)) {
    return new FindArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new FindObject(collection, iterator)._iterate();
  }
  return Aigle.resolve();
}
