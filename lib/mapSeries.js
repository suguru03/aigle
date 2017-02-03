'use strict';

const { Aigle } = require('./aigle');
const { AigleLimitArray, AigleLimitObject } = require('./internal/aigleLimit');

class MapSeriesArray extends AigleLimitArray {

  constructor(object, iterator) {
    super(object, iterator, 1);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}
class MapSeriesObject extends AigleLimitObject {

  constructor(object, iterator) {
    super(object, iterator, 1);
    this._result = Array(this._rest);
  }

  _callResolve(value, index) {
    this._result[index] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    } else if (this._index < this._size) {
      this._next();
    }
  }
}

module.exports = mapSeries;

function mapSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new MapSeriesArray(collection, iterator)._iterate();
  }
  if (collection && typeof collection === 'object') {
    return new MapSeriesObject(collection, iterator)._iterate();
  }
  return Aigle.resolve();
}

