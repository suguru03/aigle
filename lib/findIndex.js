'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class FindIndex extends Each {

  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = -1;
  }

  _callResolve(value, index) {
    if (value) {
      this._size = 0;
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    }
  }
}

module.exports = { findIndex, FindIndex };

function set(collection) {
  setShorthand.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findIndex(collection, iterator) {
  return new FindIndex(collection, iterator)._execute();
}
