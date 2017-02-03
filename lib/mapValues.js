'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class MapValuesArray extends AigleEachArray {

  constructor(collection, iterator) {
    super(collection, iterator);
    this._object = {};
  }

  _callResolve(value, index) {
    this._object[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._object);
    }
  }
}

module.exports = mapValues;

function mapValues(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapValuesArray(collection, iterator);
  }
  if (collection && typeof collection === 'object') {
    return new AigleEachObject(collection, iterator);
  }
  return Aigle.resolve();
}
