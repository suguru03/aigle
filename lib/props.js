'use strict';

const { AigleProxy } = require('./aigle');
const { promiseObjectEach } = require('./internal/util');

class AigleProps extends AigleProxy {

  constructor() {
    super();
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = { props, AigleProps };

function props(object) {
  const promise = new AigleProps();
  promiseObjectEach(promise, object);
  return promise;
}
