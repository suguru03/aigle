'use strict';

const { EachSeries } = require('./eachSeries');
const { setSeries } = require('./internal/collection');

class FindIndexSeries extends EachSeries {

  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = -1;
  }
  _callResolve(value, index) {
    if (value) {
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    } else {
      this._iterate();
    }
  }
}

module.exports = { findIndexSeries, FindIndexSeries };

function set(collection) {
  setSeries.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findIndexSeries(collection, iterator) {
  return new FindIndexSeries(collection, iterator)._execute();
}
