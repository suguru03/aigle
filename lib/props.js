'use strict';

const { Aigle } = require('./aigle');
const { INTERNAL, promiseObjectEach } = require('./internal/util');

class AigleProps {

  constructor(object) {
    const keys = Object.keys(object);
    const size = keys.length;
    this.__AIGLE_PROXY__ = true;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._keys = keys;
    this._object = object;
    this._result = {};
    if (size === 0) {
      this._promise._resolve(this._result);
    } else {
      promiseObjectEach(this);
    }
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = { props, AigleProps };

function props(object) {
  return new AigleProps(object)._promise;
}
