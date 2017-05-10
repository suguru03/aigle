'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');

parallel('longStackTracesTrace', () => {

  it('should get long trace', () => {

    Aigle.longStackTraces();
    const error = new Error('error');
    return new Aigle((resolve, reject) => {
      setImmediate(reject, error);
    })
    .then(() => assert(false))
    .catch(error => {
      const { stack } = error;
      assert(/From previous event/.test(stack));
    });
  });

  it.skip('should get long trace using config', () => {

    Aigle.config({ longStackTraces: true });
    return new Aigle(resolve => setImmediate(resolve))
    .then(() => {
      return [
        new Aigle(resolve => setImmediate(resolve)),
        new Aigle(resolve => setImmediate(resolve)),
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
