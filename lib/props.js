'use strict';

const { AigleProxy } = require('./aigle');
const { promiseObjectEach } = require('./internal/util');

class AigleProps extends AigleProxy {

  constructor(object) {
    super();
    promiseObjectEach(this, object);
  }

  _callResolve(value, key) {
    this._result[key] = value;
    if (--this._rest === 0) {
      this._resolve(this._result);
    }
  }
}

module.exports = props;

function props(object) {
  return new AigleProps(object);
}
