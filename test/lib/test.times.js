'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');

parallel('times', () => {

  it('should execute', () => {

    const count = 5;
    const iterator = n => {
      return new Aigle(resolve => setImmediate(() => resolve(n * 2)));
    };
    return Aigle.times(count, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
      });
  });

  it('should execute with synchronous function', () => {

    const count = 5;
    const iterator = n => n * 2;
    return Aigle.times(count, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
      });
  });
});

parallel('#times', () => {

  it('should execute', () => {

    const count = 5;
    const iterator = n => {
      return new Aigle(resolve => setImmediate(() => resolve(n * 2)));
    };
    return Aigle.resolve(count)
      .times(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
      });
  });
});
