'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');
const { sort } = require('./internal/util');

class SortByArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._array[index] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
  }
}

class SortByObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
    this._result = Array(this._rest);
  }

  _callResolve(criteria, index) {
    this._result[index] = { criteria, value: this._object[this._keys[index]] };
    if (--this._rest === 0) {
      this._promise._resolve(sort(this._result));
    }
  }
}

module.exports = sortBy;

function sortBy(collection, iterator) {
  if (Array.isArray(collection)) {
    return new SortByArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new SortByObject(collection, iterator)._iterate();
  }
  return Aigle.resolve([]);
}
