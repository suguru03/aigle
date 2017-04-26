'use strict';

const { call2, callProxyReciever } = require('./util');

module.exports = {
  execute,
  setParallel,
  setSeries,
  setLimit
};

function execute(collection) {
  this._callResolve = this._iterate;
  this._set(collection);
  this._execute();
}

function setParallel(collection) {
  if (Array.isArray(collection)) {
    this._coll = collection;
    this._rest = collection.length;
    this._iterate = iterateArrayParallel;
  } else if (collection && typeof collection === 'object') {
    const keys = Object.keys(collection);
    this._coll = collection;
    this._rest = keys.length;
    this._keys = keys;
    this._iterate = iterateObjectParallel;
  } else {
    this._rest = 0;
  }
  return this;
}

function setSeries(collection) {
  if (Array.isArray(collection)) {
    this._coll = collection;
    this._size = collection.length;
    this._iterate = iterateArraySeries;
  } else if (collection && typeof collection === 'object') {
    const keys = Object.keys(collection);
    this._coll = collection;
    this._size = keys.length;
    this._keys = keys;
    this._iterate = iterateObjectSeries;
  } else {
    this._size = 0;
    this._rest = 0;
  }
  this._rest = this._size;
  return this;
}

function setLimit(collection) {
  if (Array.isArray(collection)) {
    this._coll = collection;
    this._size = collection.length;
    this._keys = undefined;
    this._iterate = iterateArraySeries;
  } else if (collection && typeof collection === 'object') {
    const keys = Object.keys(collection);
    this._coll = collection;
    this._size = keys.length;
    this._keys = keys;
    this._iterate = iterateObjectSeries;
  } else {
    this._size = 0;
    this._rest = 0;
  }
  const { _limit, _size } = this;
  this._rest = _size;
  this._limit = _limit < _size ? _limit : _size;
  this._callRest = _size - this._limit;
  return this;
}


function iterateArrayParallel() {
  const { _rest, _iterator, _coll } = this;
  let i = -1;
  while (++i < _rest && callProxyReciever(call2(_iterator, _coll[i], i), this, i)) {}
}

function iterateObjectParallel() {
  const { _rest, _iterator, _coll, _keys } = this;
  let i = -1;
  while (++i < _rest) {
    const key = _keys[i];
    if (callProxyReciever(call2(_iterator, _coll[key], key), this, i) === false) {
      break;
    }
  }
}

function iterateArraySeries() {
  const i = this._index++;
  callProxyReciever(call2(this._iterator, this._coll[i], i), this, i);
}

function iterateObjectSeries() {
  const i = this._index++;
  const key = this._keys[i];
  callProxyReciever(call2(this._iterator, this._coll[key], key), this, i);
}
