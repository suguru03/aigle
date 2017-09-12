'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { TimeoutError } = Aigle;
const { DELAY } = require('../config');

parallel('#timeout', () => {

  it('should time out', () => {

    const value = 10;
    return Aigle.delay(DELAY * 3, value)
      .timeout(DELAY)
      .then(() => assert(false))
      .catch(error => {
        assert.ok(error);
        assert.ok(error instanceof TimeoutError);
        assert.strictEqual(error.message, 'operation timed out');
      });
  });

  it('should not time out', () => {

    const value = 10;
    return Aigle.delay(DELAY, value)
      .timeout(DELAY * 3)
      .then(res => assert.strictEqual(res, value))
      .delay(DELAY * 5)
      .catch(() => assert.ok(false));
  });

  it('should time out with message', () => {

    const message = 'timeout';
    return Aigle.delay(DELAY * 3, 'delay')
      .timeout(DELAY, message)
      .then(() => assert(false))
      .catch(error => assert.strictEqual(error, message));
  });
});
