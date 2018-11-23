'use strict';

const { call3, callProxyReciever } = require('./util');

const [setParallel, setParallelWithOrder, setSeries] = [
  [iterateArrayParallel, iterateObjectParallel],
  [iterateArrayParallel, iterateObjectParallelWithOrder],
  [iterateArraySeries, iterateObjectSeries]
].map(createSet);

const arrayIteratorList = [
  iterateArrayParallel,
  iterateArrayWithString,
  iterateArrayWithObject,
  iterateArrayWithArray
];
const objectIteratorList = [
  iterateObjectParallel,
  iterateObjectWithString,
  iterateObjectWithObject,
  iterateObjectWithArray
];
const [setShorthand, setShorthandWithOrder, setPickShorthand, setOmitShorthand] = [
  [arrayIteratorList, objectIteratorList],
  [arrayIteratorList, [iterateObjectParallelWithOrder, ...objectIteratorList.slice(1)]],
  [
    [...arrayIteratorList.slice(0, 3), iteratePickWithArray],
    [...objectIteratorList.slice(0, 3), iteratePickWithArray]
  ],
  [
    [...arrayIteratorList.slice(0, 3), iterateOmitWithArray],
    [...objectIteratorList.slice(0, 3), iterateOmitWithArray]
  ]
].map(createSetShorthand);

module.exports = {
  execute,
  setParallel,
  setParallelWithOrder,
  setShorthand,
  setShorthandWithOrder,
  setPickShorthand,
  setOmitShorthand,
  setSeries,
  setLimit
};

function execute(collection) {
  this._callResolve = this._iterate;
  this._set(collection);
  this._execute();
}

function createSet([iterateArray, iterateObject]) {
  return function set(collection) {
    if (Array.isArray(collection)) {
      this._coll = collection;
      this._size = collection.length;
      this._iterate = iterateArray;
    } else if (collection && typeof collection === 'object') {
      const keys = Object.keys(collection);
      this._coll = collection;
      this._size = keys.length;
      this._keys = keys;
      this._iterate = iterateObject;
    } else {
      this._size = 0;
    }
    this._rest = this._size;
    return this;
  };
}

function createSetShorthand(list) {
  const [getArrayIterator, getObjectIterator] = list.map(createIteratorGetter);
  return function set(collection) {
    if (Array.isArray(collection)) {
      this._coll = collection;
      this._size = collection.length;
      this._iterate = getArrayIterator(this._iterator);
    } else if (collection && typeof collection === 'object') {
      const keys = Object.keys(collection);
      this._coll = collection;
      this._size = keys.length;
      this._keys = keys;
      this._iterate = getObjectIterator(this._iterator);
    } else {
      this._size = 0;
    }
    this._rest = this._size;
    return this;
  };
}

function createIteratorGetter([
  iterateParallel,
  iterateWithString,
  iterateWithObject,
  iterateWithArray
]) {
  return iterator => {
    switch (typeof iterator) {
      case 'function':
        return iterateParallel;
      case 'string':
        return iterateWithString;
      case 'object':
        return Array.isArray(iterator) ? iterateWithArray : iterateWithObject;
    }
  };
}

function setLimit(collection) {
  setSeries.call(this, collection);
  const { _limit, _size } = this;
  this._limit = _limit < _size ? _limit : _size;
  this._callRest = _size - this._limit;
  return this;
}

function iterateArrayParallel() {
  const { _rest, _iterator, _coll } = this;
  let i = -1;
  while (++i < _rest && callProxyReciever(call3(_iterator, _coll[i], i, _coll), this, i)) {}
}

function iterateObjectParallel() {
  const { _rest, _iterator, _coll, _keys } = this;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    if (callProxyReciever(call3(_iterator, _coll[key], key, _coll), this, i) === false) {
      break;
    }
  }
}
function iterateObjectParallelWithOrder() {
  const { _rest, _iterator, _coll, _keys, _result } = this;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    _result[key] = undefined;
    if (callProxyReciever(call3(_iterator, _coll[key], key, _coll), this, i) === false) {
      break;
    }
  }
}

function iterateArraySeries() {
  const { _coll } = this;
  const i = this._index++;
  callProxyReciever(call3(this._iterator, _coll[i], i, _coll), this, i);
}

function iterateObjectSeries() {
  const { _coll } = this;
  const i = this._index++;
  const key = this._keys[i];
  callProxyReciever(call3(this._iterator, _coll[key], key, _coll), this, i);
}

function iterateArrayWithString() {
  const { _iterator, _coll } = this;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[i];
    if (obj) {
      this._callResolve(obj[_iterator], i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateObjectWithString() {
  const { _iterator, _coll, _keys } = this;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[_keys[i]];
    if (obj) {
      this._callResolve(obj[_iterator], i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateArrayWithArray() {
  const { _coll } = this;
  const [key, value] = this._iterator;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[i];
    if (obj) {
      this._callResolve(obj[key] === value, i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateObjectWithArray() {
  const { _coll, _keys } = this;
  const [key, value] = this._iterator;
  let i = -1;
  while (++i < this._size) {
    const obj = _coll[_keys[i]];
    if (obj) {
      this._callResolve(obj[key] === value, i);
    } else {
      this._callResolve(undefined, i);
    }
  }
}

function iterateArrayWithObject() {
  const { _iterator: object, _coll } = this;
  const keys = Object.keys(object);
  let i = -1;
  first: while (++i < this._size) {
    const obj = _coll[i];
    if (!obj) {
      this._callResolve(undefined, i);
      continue;
    }
    let l = keys.length;
    while (l--) {
      const key = keys[l];
      if (obj[key] !== object[key]) {
        this._callResolve(false, i);
        continue first;
      }
    }
    this._callResolve(true, i);
  }
}

function iterateObjectWithObject() {
  const { _iterator: object, _coll, _keys } = this;
  const keys = Object.keys(object);
  let i = -1;
  first: while (++i < this._size) {
    const obj = _coll[_keys[i]];
    if (!obj) {
      this._callResolve(undefined, i);
      continue;
    }
    let l = keys.length;
    while (l--) {
      const key = keys[l];
      if (obj[key] !== object[key]) {
        this._callResolve(false, i);
        continue first;
      }
    }
    this._callResolve(true, i);
  }
}

function iteratePickWithArray() {
  const { _coll, _result } = this;
  pick(this._iterator);
  this._promise._resolve(_result);

  function pick(array) {
    let i = -1;
    while (++i < array.length) {
      const key = array[i];
      if (Array.isArray(key)) {
        pick(key);
        continue;
      }
      if (_coll.hasOwnProperty(key)) {
        _result[key] = _coll[key];
      }
    }
  }
}

function iterateOmitWithArray() {
  const { _coll, _result } = this;
  const map = {};
  createMap(this._iterator);
  Object.keys(_coll).forEach(key => {
    if (map.hasOwnProperty(key) === false) {
      _result[key] = _coll[key];
    }
  });
  this._promise._resolve(_result);

  function createMap(array) {
    let i = -1;
    while (++i < array.length) {
      const key = array[i];
      if (Array.isArray(key)) {
        createMap(key);
        continue;
      }
      map[key] = true;
    }
  }
}
