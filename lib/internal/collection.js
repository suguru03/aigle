'use strict';

const { call3, callProxyReciever } = require('./util');

const [setParallel, setSeries] = [
  [iterateArrayParallel, iterateObjectParallel],
  [iterateArraySeries, iterateObjectSeries]
].map(createSet);

module.exports = {
  execute,
  setParallel,
  setShorthand,
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

function setShorthand(collection) {
  if (Array.isArray(collection)) {
    this._coll = collection;
    this._size = collection.length;
    switch (typeof this._iterator) {
    case 'function':
      this._iterate = iterateArrayParallel;
      break;
    case 'string':
      this._iterate = iterateArrayWithString;
      break;
    case 'object':
      this._iterate = Array.isArray(this._iterator) ? iterateArrayWithArray : iterateArrayWithObject;
      break;
    }
  } else if (collection && typeof collection === 'object') {
    const keys = Object.keys(collection);
    this._coll = collection;
    this._size = keys.length;
    this._keys = keys;
    switch (typeof this._iterator) {
    case 'function':
      this._iterate = iterateObjectParallel;
      break;
    case 'string':
      this._iterate = iterateObjectWithString;
      break;
    case 'object':
      this._iterate = Array.isArray(this._iterator) ? iterateObjectWithArray : iterateObjectWithObject;
      break;
    }
  } else {
    this._size = 0;
  }
  this._rest = this._size;
  return this;
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
  const {  _iterator, _coll, _keys } = this;
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
  const {  _coll, _keys } = this;
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
  const {  _iterator: object, _coll, _keys } = this;
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
