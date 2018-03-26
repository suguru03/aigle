'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');

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
