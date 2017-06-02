'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');

parallel('longStackTracesTrace', () => {

  it('should get long trace', () => {

    Aigle.longStackTraces();
    const error = new Error('error');
    return new Aigle((resolve, reject) => {
      process.nextTick(reject, error);
    })
    .then(() => assert(false))
    .catch(error => {
      const { stack } = error;
      assert(/From previous event/.test(stack));
    });
  });

  it('should get long trace using config', () => {

    Aigle.config({ longStackTraces: true });
    return new Aigle(resolve => process.nextTick(resolve))
    .then(() => {
      return [
        new Aigle(resolve => process.nextTick(resolve)),
        new Aigle(resolve => process.nextTick(resolve)),
        Aigle.reject(new Error('error'))
      ];
    })
    .all()
    .catch(err => {
      const { stack } = err;
      assert(/From previous event/.test(stack));
    });
  });

});
