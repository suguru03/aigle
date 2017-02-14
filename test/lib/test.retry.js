'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');

parallel('retry', () => {

  it('should execute', () => {

    let count = 0;
    const limit = 5;
    const iterator = () => {
      return new Aigle((resolve, reject) => {
        if (++count === limit) {
          resolve(count);
        } else {
          reject('continue');
        }
      });
    };
    return Aigle.retry(limit, iterator)
      .then(res => {
        assert.strictEqual(res, 5);
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
    return Aigle.retry(limit, iterator)
      .catch(error => {
        assert.ok(error);
        assert.strictEqual(count, 5);
      });
  });
});
