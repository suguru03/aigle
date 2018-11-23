'use strict';

const { Series } = require('./series');
const { DEFAULT_LIMIT } = require('./internal/util');

class ParallelLimit extends Series {
  constructor(coll, limit = DEFAULT_LIMIT) {
    super(coll);
    this._size = this._rest;
    this._limit = limit;
  }

  _execute() {
    const { _limit, _rest } = this;
    if (_rest === 0) {
      this._promise._resolve(this._result);
      return this._promise;
    }
    this._size = _rest;
    this._iterate = iterate;
    let limit = _limit < _rest ? _limit : _rest;
    while (limit--) {
      this._iterate();
    }
    return this._promise;
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }

  _callResolveMap(value, key) {
    this._result.set(key, value);
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    } else {
      this._iterate();
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { parallelLimit, ParallelLimit };

function iterate() {
  ++this._index < this._size &&
    this._iterator(this, this._coll, this._index, this._result, this._keys);
}

function parallelLimit(collection, limit) {
  return new ParallelLimit(collection, limit)._execute();
}
