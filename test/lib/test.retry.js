'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('retry', () => {
  it('should execute', () => {
    let count = 0;
    const limit = 6;
    const iterator = () => {
      return new Aigle((resolve, reject) => {
        if (++count === limit) {
          resolve(count);
        } else {
          reject('continue');
        }
      });
    };
    return Aigle.retry(limit, iterator).then(res => {
      assert.strictEqual(res, 6);
      assert.strictEqual(count, 6);
    });
  });

  it('should execute with default limit', () => {
    let count = 0;
    let error = new TypeError('continue');
    const iterator = () => {
      count++;
      return new Aigle((resolve, reject) => reject(error));
    };
    return Aigle.retry(iterator)
      .then(() => assert(false))
      .catch(error => {
        assert.ok(error instanceof TypeError);
        assert.strictEqual(count, 5);
      });
  });

  it('should execute with interval', () => {
    const times = 3;
    const interval = DELAY * 3;
    const opts = { times, interval };
    let count = 0;
    const error = new Error('error');
    const iterator = () => {
      count++;
      return Aigle.reject(error);
    };
    const start = Date.now();
    return Aigle.retry(opts, iterator)
      .then(() => assert(false))
      .catch(err => {
        assert.strictEqual(err, error);

        const diff = Date.now() - start;
        assert(diff >= interval * (times - 1));
        assert.strictEqual(count, 3);
      });
  });

  it('should execute with a interval function', () => {
    const interval = c => c * DELAY;
    const opts = { interval };
    let count = 0;
    const error = new Error('error');
    const iterator = () => {
      count++;
      return Aigle.reject(error);
    };
    const start = Date.now();
    return Aigle.retry(opts, iterator)
      .then(() => assert(false))
      .catch(err => {
        assert.strictEqual(err, error);
        const diff = Date.now() - start;
        assert(diff >= DELAY * 10);
        assert.strictEqual(count, 5);
      });
  });

  it('should execute with predicate function', () => {
    let count = 0;
    const limit = 2;
    const makeIterator = (error) => () => {
      return new Aigle((resolve, reject) => {
        if (++count === limit) {
          resolve(count);
        } else {
          reject(error);
        }
      });
    };
    const errorRetry = new Error('retry');
    const errorDontRetry = new Error('dontRetry');
    const predicate = err => err.message === errorRetry.message;
    const retryOpts = { limit, predicate };
    return Aigle
      .retry(retryOpts, makeIterator(errorRetry))
      .then(res => {
        assert.strictEqual(res, limit);
        assert.strictEqual(count, limit);
      })
      .then(() => Aigle.retry(retryOpts, makeIterator(errorDontRetry)))
      .then(() => assert(false))
      .catch(err => {
        assert.strictEqual(err, errorDontRetry);
        assert.strictEqual(count, limit + 1);
      });
  });

  it('should throw if predicate is set but is not a function', () => {
    return assert.throws(
      () => Aigle.retry({ predicate: 'bad' }, () => true),
      new Error('predicate needs to be a function')
    );
  });

  it('should throw an error', () => {
    let count = 0;
    const limit = 5;
    const iterator = () => {
      return new Aigle((resolve, reject) => {
        ++count;
        reject('continue');
      });
    };
    return Aigle.retry(limit, iterator).catch(error => {
      assert.ok(error);
      assert.strictEqual(count, 5);
    });
  });
});
