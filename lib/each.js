'use strict';

const { Aigle } = require('./aigle');
const { AigleEachArray, AigleEachObject } = require('./internal/aigleEach');

class EachArray extends AigleEachArray {

  constructor(collection, iterator) {
    super(collection, iterator);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

class EachObject extends AigleEachObject {

  constructor(collection, iterator) {
    super(collection, iterator);
  }

  _callResolve() {
    if (--this._rest === 0) {
      this._resolve();
    }
  }
}

module.exports = each;

function each(collection, iterator) {
  if (Array.isArray(collection)) {
    return new EachArray(collection, iterator);
  }
  if (collection && typeof collection === 'object') {
    return new EachObject(collection, iterator);
  }
  return Aigle.resolve();
}
