'use strict';

const AigleCore = require('aigle-core');
const DEFAULT_LIMIT = 8;
const errorObj = { e: undefined };
class DummyPromise {

  constructor(value, key) {
    this._resolved = 1;
    this._key = key;
    this._value = value;
  }
}

module.exports = {
  DEFAULT_LIMIT,
  DummyPromise,
  INTERNAL,
  errorObj,
  call1,
  call2Array,
  call2Object,
  call3,
  apply,
  makeResolve,
  makeReject,
  makeCallResolve,
  promiseArrayEach,
  promiseObjectEach,
  compactArray,
  clone,
  cloneArray,
  cloneObject,
  sort
};

function INTERNAL() {}

function call1(handler, value) {
  try {
    return handler(value);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function _call2(handler, arg1, arg2) {
  try {
    return handler(arg1, arg2);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call3(handler, arg1, arg2, arg3) {
  try {
    return handler(arg1, arg2, arg3);
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function apply(handler, array) {
  try {
    switch (array.length) {
    case 0:
      return handler();
    case 1:
      return handler(array[0]);
    case 2:
      return handler(array[0], array[1]);
    case 3:
      return handler(array[0], array[1], array[2]);
    default:
      return handler.apply(null, array);
    }
  } catch(e) {
    errorObj.e = e;
    return errorObj;
  }
}

function call2Array(promise, index) {
  const p = _call2(promise._iterator, promise._array[index], index);
  if (p === errorObj) {
    promise._reject(errorObj.e);
    return false;
  }
  if (p instanceof AigleCore) {
    switch (p._resolved) {
    case 0:
      p._addReceiver(promise, index);
      return true;
    case 1:
      promise._callResolve(p._value, index);
      return true;
    case 2:
      promise._reject(p._value);
      return false;
    }
  }
  if (p && p.then) {
    p.then(makeCallResolve(promise, index), makeReject(promise));
  } else {
    promise._callResolve(p, index);
  }
  return true;
}

function call2Object(promise, index) {
  const key = promise._keys[index];
  const p = _call2(promise._iterator, promise._object[key], key);
  if (p === errorObj) {
    promise._reject(errorObj.e);
    return false;
  }
  if (p instanceof AigleCore) {
    switch (p._resolved) {
    case 0:
      p._addReceiver(promise, index);
      return true;
    case 1:
      promise._callResolve(p._value, index);
      return true;
    case 2:
      promise._reject(p._value);
      return false;
    }
  }
  if (p && p.then) {
    p.then(makeCallResolve(promise, index), makeReject(promise));
  } else {
    promise._callResolve(p, index);
  }
  return true;
}

function makeResolve(promise) {
  return function(value) {
    promise._resolve(value);
  };
}

function makeReject(promise) {
  return function(reason) {
    promise._reject(reason);
  };
}

function makeCallResolve(promise, key) {
  return function(value) {
    promise._callResolve(value, key);
  };
}

function promiseArrayEach(promise, array) {
  const size = array.length;
  if (size === 0) {
    promise._resolve([]);
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = array;
  while (++i < size) {
    const p = array[i];
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        p._addReceiver(promise, i);
        continue;
      case 1:
        promise._callResolve(p._value, i);
        continue;
      case 2:
        promise._reject(p._value);
        return;
      }
    }
    if (p && p.then) {
      p.then(makeCallResolve(promise, i), makeReject(promise));
    } else {
      promise._callResolve(p, i);
    }
  }
}

function promiseObjectEach(promise, object) {
  if (!object) {
    promise._resolve({});
    return;
  }
  const keys = Object.keys(object);
  const size = keys.length;
  if (size === 0) {
    promise._resolve({});
    return;
  }
  let i = -1;
  promise._rest = size;
  promise._result = {};
  while (++i < size) {
    const key = keys[i];
    const p = object[key];
    if (p instanceof AigleCore) {
      switch (p._resolved) {
      case 0:
        p._addReceiver(promise, key);
        continue;
      case 1:
        promise._callResolve(p._value, key);
        continue;
      case 2:
        promise._reject(p._value);
        return;
      }
    }
    if (p && p.then) {
      p.then(makeCallResolve(promise, key), makeReject(promise));
    } else {
      promise._callResolve(p, key);
    }
  }
}

function compactArray(array) {
  let i = -1;
  const l = array.length;
  const result = [];
  while (++i < l) {
    const value = array[i];
    if (value !== INTERNAL) {
      result.push(value);
    }
  }
  return result;
}

function clone(target) {
  return Array.isArray(target) ? cloneArray(target) : cloneObject(target);
}

function cloneArray(array) {
  let l = array.length;
  const result = Array(l);
  while (l--) {
    result[l] = array[l];
  }
  return result;
}

function cloneObject(object) {
  const keys = Object.keys(object);
  let l = keys.length;
  const result = {};
  while (l--) {
    const key = keys[l];
    result[key] = object[key];
  }
  return result;
}


function sortIterator(a, b) {
  return a.criteria - b.criteria;
}

function sort(array) {
  array.sort(sortIterator);
  let l = array.length;
  while (l--) {
    array[l] = array[l].value;
  }
  return array;
}
