'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class FindKeySeries extends EachSeries {
  constructor(collection, iterator) {
    super(collection, iterator, set);
  }
}

module.exports = { findKeySeries, FindKeySeries };

function set(collection) {
  setSeries.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (value) {
    this._promise._resolve(`${index}`);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (value) {
    this._promise._resolve(this._keys[index]);
  } else if (--this._rest === 0) {
    this._promise._resolve();
  } else {
    this._iterate();
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findKeySeries(collection, iterator) {
  return new FindKeySeries(collection, iterator)._execute();
}
