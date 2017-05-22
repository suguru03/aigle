'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');

const Aigle = require('../../');
const { DELAY } = require('../config');
const { CancellationError } = Aigle;

describe('#cancel', () => {

  before(() => Aigle.config({ cancellation: true }));

  it('should call a canceling function', () => {
    let called = false;
    const promise = new Aigle((resolve, reject, onCancel) => {
      setTimeout(resolve, DELAY);
      onCancel(() => called = true);
    });
    promise.cancel();
    return promise.then(assert.fail)
      .catch(error => {
        assert.ok(called);
        assert.ok(error instanceof CancellationError);
        assert.strictEqual(error.message, 'late cancellation observer');
      });
  });

  it('should call multiple handlers', () => {

    let called = 0;
    const promise = new Aigle((resolve, reject, onCancel) => {
      setTimeout(resolve, DELAY);
      onCancel(() => called++);
      onCancel(() => called++);
      onCancel(() => called++);
      onCancel(() => called++);
    });
    promise.cancel();
    return promise.then(assert.fail)
      .catch(error => {
        assert.strictEqual(called, 4);
        assert.ok(error instanceof CancellationError);
        assert.strictEqual(error.message, 'late cancellation observer');
      });
  });

  it('should not call handlers which are registered after cancelled', () => {

    let called = 0;
    const promise = new Aigle((resolve, reject, onCancel) => {
      setTimeout(resolve, DELAY);
      onCancel(() => called++);
    });
    promise.cancel();
    new Aigle((resolve, reject, onCancel) => {
      resolve(promise);
      onCancel(() => called++);
    }).suppressUnhandledRejections();
    return promise.then(assert.fail)
      .catch(error => {
        assert.strictEqual(called, 1);
        assert.ok(error instanceof CancellationError);
        assert.strictEqual(error.message, 'late cancellation observer');
      });
  });

  it('should not affect even if cancel is called multiple times', () => {

    let called = 0;
    const promise = new Aigle((resolve, reject, onCancel) => {
      setTimeout(resolve, DELAY);
      onCancel(() => called++);
    });
    promise.cancel();
    promise.cancel();
    promise.cancel();
    return promise.then(assert.fail)
      .catch(error => {
        assert.strictEqual(called, 1);
        assert.ok(error instanceof CancellationError);
      });
  });

  it('should catch an error', () => {

    let called = 0;
    const error = new Error('error');
    return new Aigle((resolve, reject, onCancel) => {
      setTimeout(reject, DELAY, error);
      onCancel(() => called++);
    })
    .then(assert.fail)
    .catch(err => {
      assert.strictEqual(called, 0);
      assert.strictEqual(err, error);
    });
  });

  it('should throw an TypeError if canceling function is not function', () => {

    return new Aigle((resolve, reject, onCancel) => {
      onCancel(1);
    })
    .then(assert.fail)
    .catch(TypeError, assert.ok);
  });

  it('should work only once if resolve and reject are called multiple times', () => {

    let called = 0;
    return new Aigle((resolve, reject, onCancel) => {
      process.nextTick(resolve, 1);
      process.nextTick(resolve, 2);
      process.nextTick(reject, 3);
      process.nextTick(reject, 4);
      onCancel(() => called++);
    })
    .then(value => {
      assert.strictEqual(called, 0);
      assert.strictEqual(value, 1);
    });
  });

  it('should cancel a delayed promise', () => {

    const promise = Aigle.delay(DELAY);
    promise.cancel();
    return promise.then(assert.fail)
      .catch(error => assert.ok(error instanceof CancellationError));
  });

  it('should not notify unhandled rejection error', done => {

    process.on('unhandledRejection', done);
    let called = 0;
    const promise = new Aigle((resolve, reject, onCancel) => {
      setTimeout(resolve, DELAY);
      onCancel(() => called++);
    });
    promise.cancel();
    new Aigle((resolve, reject, onCancel) => {
      resolve(promise);
      onCancel(() => called++);
    }).suppressUnhandledRejections();
    setTimeout(() => {
      assert.strictEqual(called, 1);
      process.removeListener('unhandledRejection', done);
      done();
    }, DELAY);
  });
});

parallel('#cancel:false', () => {

  before(() => Aigle.config({ cancellation: false }));

  it('should throw an TypeError if cancellation is not enabled', () => {

    let called = 0;
    return new Aigle((resolve, reject, onCancel) => {
      setTimeout(resolve, DELAY);
      onCancel(() => called++);
    })
    .then(assert.fail)
    .catch(error => {
      assert.ok(error);
      assert.ok(error instanceof TypeError);
    });
  });

  it('should not work a canceling function', () => {

    const promise = new Aigle(resolve => {
      setTimeout(resolve, DELAY, 1);
    });
    promise.cancel();
    return promise.then(value => assert.strictEqual(value, 1));
  });
});
