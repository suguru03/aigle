'use strict';

const { Aigle } = require('./aigle');
const {
  AigleLimitArray,
  AigleLimitObject
} = require('./internal/aigleLimit');

class EachSeriesArray extends AigleLimitArray {

  constructor(array, iterator) {
    super(array, iterator, 1);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else {
      this._iterate();
    }
  }
}

class EachSeriesObject extends AigleLimitObject {

  constructor(array, iterator) {
    super(array, iterator, 1);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    } else {
      this._iterate();
    }
  }
}

module.exports = eachSeries;

function eachSeries(collection, iterator) {
  if (Array.isArray(collection)) {
    return new EachSeriesArray(collection, iterator);
  }
  if (collection && typeof collection === 'object') {
    return new EachSeriesObject(collection, iterator);
  }
  return Aigle.resolve();
}

