'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class FindKey extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { findKey, FindKey };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._size = 0;
    this._promise._resolve(`${index}`);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._size = 0;
    this._promise._resolve(this._keys[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findKey(collection, iterator) {
  return new FindKey(collection, iterator)._execute();
}
