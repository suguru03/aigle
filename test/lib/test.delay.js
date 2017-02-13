'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('delay', () => {

  it('should be delay', () => {

    const start = Date.now();
    return Aigle.delay(DELAY)
      .then(() => {
        const diff = Date.now() - start;
        assert.ok(diff >= DELAY);
      });
  });

  it('should be delay with value', () => {

    const start = Date.now();
    const str = 'test';
    return Aigle.delay(DELAY, str)
      .then(value => {
        const diff = Date.now() - start;
        assert.ok(diff >= DELAY);
        assert.strictEqual(value, str);
      });
  });

});

parallel('#delay', () => {

  it('should be delay', () => {

    const start = Date.now();
    return new Aigle(resolve => resolve())
      .delay(DELAY)
      .then(() => {
        const diff = Date.now() - start;
        assert.ok(diff >= DELAY);
      });
  });

  it('should be delay with value', () => {

    const start = Date.now();
    const str = 'test';
    return Aigle.resolve(str)
      .delay(DELAY)
      .then(value => {
        const diff = Date.now() - start;
        assert.ok(diff >= DELAY);
        assert.strictEqual(value, str);
      });
  });

});
