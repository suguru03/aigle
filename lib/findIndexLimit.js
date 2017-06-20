'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class FindIndexLimit extends EachLimit {

  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
    this._result = -1;
  }

  _callResolve(value, index) {
    if (value) {
      this._callRest = 0;
      this._promise._resolve(index);
    } else if (--this._rest === 0) {
      this._promise._resolve(-1);
    } else if (this._callRest-- > 0) {
      this._iterate();
    }
  }
}

module.exports = { findIndexLimit, FindIndexLimit };

function set(collection) {
  setLimit.call(this, collection);
  if (this._keys !== undefined) {
    this._rest = 0;
  }
  return this;
}

/**
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 */
function findIndexLimit(collection, limit, iterator) {
  return new FindIndexLimit(collection, limit, iterator)._execute();
}
