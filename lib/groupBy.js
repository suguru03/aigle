'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class GroupByArray extends AigleEachArray {

  constructor(array, iterator) {
    super(array, iterator);
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
    }
  }
}

class GroupByObject extends AigleEachObject {

  constructor(object, iterator) {
    super(object, iterator);
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
    }
  }
}

module.exports = groupBy;

function groupBy(collection, iterator) {
  if (Array.isArray(collection)) {
    return new GroupByArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new GroupByObject(collection, iterator)._iterate();
  }
  return Aigle.resolve({});
}
