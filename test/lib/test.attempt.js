'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('attempt', () => {
  it('should execute', () => {
    const value = 1;
    const handler = () => {
      return Aigle.delay(DELAY).then(() => value);
    };
    return Aigle.attempt(handler).then(res => assert.strictEqual(res, value));
  });

  it('should throw an error on synchronous', () => {
    const error = new Error('error');
    const handler = () => {
      throw error;
    };
    return Aigle.attempt(handler)
      .then(() => assert(false))
      .catch(err => assert.strictEqual(err, error));
  });

  it('should throw an error on asynchronous', () => {
    const error = new Error('error');
    const handler = () => {
      return Aigle.delay(DELAY).then(() => {
        throw error;
      });
    };
    return Aigle.attempt(handler)
      .then(() => assert(false))
      .catch(err => assert.strictEqual(err, error));
  });
});

parallel('try', () => {
  it('should execute', () => {
    const value = 1;
    const handler = () => {
      return Aigle.delay(DELAY).then(() => value);
    };
    return Aigle.try(handler).then(res => assert.strictEqual(res, value));
  });
});
