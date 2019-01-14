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

/**
 * `Aigle.parallel` functionality has the same functionality as [`Aigle.parallel`](https://suguru03.github.io/aigle/docs/global.html#parallel)
 * and it works with concurrency.
 * @param {Array|Object} collection - it should be an array/object of functions or Promise instances
 * @param {integer} [limit=8] - It is concurrncy, default is 8
 * @example
 *   Aigle.parallelLimit([
 *     () => Aigle.delay(30, 1),
 *     Aigle.delay(20, 2),
 *     3
 *   ]).then(array => {
 *     console.log(array); // [1, 2, 3]
 *   });
 *
 * @example
 *   Aigle.parallelLimit({
 *     a: () => Aigle.delay(30, 1),
 *     b: Aigle.delay(20, 2),
 *     c: 3
 *   }, 2).then(obj => {
 *     console.log(obj); // { a: 1, b: 2, c: 3 }
 *   });
 */
function parallelLimit(collection, limit) {
  return new ParallelLimit(collection, limit)._execute();
}
