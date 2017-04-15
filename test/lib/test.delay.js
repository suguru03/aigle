'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY * 5;

parallel('delay', () => {

  it('should be delay', () => {

    const start = Date.now();
    return Aigle.delay(DELAY)
      .then(() => {
        const diff = Date.now() - start;
        assert.ok(diff >= DELAY, `diff: ${diff}ms, DELAY: ${DELAY}ms`);
      });
  });

  it('should be delay with value', () => {

    const start = Date.now();
    const str = 'test';
    return Aigle.delay(DELAY, str)
      .then(value => {
        const diff = Date.now() - start;
        assert.ok(diff >= DELAY, `diff: ${diff}ms, DELAY: ${DELAY}ms`);
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
        assert.ok(diff >= DELAY, `diff: ${diff}ms, DELAY: ${DELAY}ms`);
      });
  });

  it('should be delay with value', () => {

    const start = Date.now();
    const str = 'test';
    return Aigle.resolve(str)
      .delay(DELAY)
      .then(value => {
        const diff = Date.now() - start;
        assert.ok(diff >= DELAY, `diff: ${diff}ms, DELAY: ${DELAY}ms`);
        assert.strictEqual(value, str);
      });
  });

  it('should not delay if error is caused', () => {

    const start = Date.now();
    const str = 'test';
    return Aigle.reject(str)
      .delay(DELAY)
      .catch(value => {
        const diff = Date.now() - start;
        assert.ok(diff < DELAY, `diff: ${diff}ms, DELAY: ${DELAY}ms`);
        assert.strictEqual(value, str);
      });
  });

  it('should not delay with a rejected promise', done => {

    process.on('unhandledRejection', done);
    const error = new Error('error');
    const promise = Aigle.reject(error);
    promise.catch(error => assert(error));
    setTimeout(() => {
      const start = Date.now();
      promise.delay(DELAY)
        .then(() => assert(false))
        .catch(err => {
          const diff = Date.now() - start;
          assert.ok(diff < DELAY, `diff: ${diff}, DELAY: ${DELAY}`);
          assert.strictEqual(err, error);
          done();
        });
    }, DELAY);
  });
});
