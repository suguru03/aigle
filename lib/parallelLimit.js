'use strict';

const { DEFAULT_LIMIT, PENDING } = require('./internal/util');
const { Series } = require('./series');

class ParallelLimit extends Series {
  constructor(coll, limit = DEFAULT_LIMIT) {
    super(coll);
    this._set = super._set;
    this._limit = limit;
    if (coll === PENDING) {
      this._callResolve = set;
    } else {
      set.call(this, coll);
    }
  }

  _iterate() {}

  _set() {}

  _execute() {
    const { _limit, _size } = this;
    if (_size === 0) {
      return this._promise._resolve(this._result);
    }
    let limit = _limit < _size ? _limit : _size;
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

function set(coll) {
  this._set(coll);
  this._size = this._rest;
  this._iterate = iterate;
  this._execute();
}

function iterate() {
  ++this._index < this._size &&
    this._iterator(this, this._coll, this._index, this._result, this._keys);
}

function parallelLimit(collection, limit) {
  return new ParallelLimit(collection, limit)._promise;
}
