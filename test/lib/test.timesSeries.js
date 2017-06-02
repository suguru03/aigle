'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const { DELAY } = require('../config');

parallel('timesSeries', () => {

  it('should execute', () => {

    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 ? (n + 3) * DELAY : (n + 1) * DELAY;
      return new Aigle(resolve => setTimeout(() => {
        order.push(n);
        resolve(n * 2);
      }, delay));
    };
    return Aigle.timesSeries(count, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
        assert.deepEqual(order, [0, 1, 2, 3, 4]);
      });
  });

  it('should execute with synchronous function', () => {

    const count = 5;
    const iterator = n => n * 2;
    return Aigle.timesSeries(count, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
      });
  });

  it('should return an empty array if times is not number', () => {

    const iterator = n => n * 2;
    return Aigle.timesSeries('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an array even if iterator is undefined', () => {

    return Aigle.timesSeries(5)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 5);
        assert.deepEqual(res, [0, 1, 2, 3, 4]);
      });
  });

  it('should catch a TypeError', () => {

    const count = 5;
    const iterator = n => n.test();
    return Aigle.timesSeries(count, iterator)
      .then(assert.fail)
      .catch(TypeError, assert.ok);
  });
});

parallel('#timesSeries', () => {

  it('should execute', () => {

    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 ? (n + 3) * DELAY : (n + 1) * DELAY;
      return new Aigle(resolve => setTimeout(() => {
        order.push(n);
        resolve(n * 2);
      }, delay));
    };
    return Aigle.resolve(count)
      .timesSeries(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
        assert.deepEqual(order, [0, 1, 2, 3, 4]);
      });
  });

  it('should execute with delay', () => {

    const count = 5;
    const iterator = n => n * 2;
    return Aigle.delay(DELAY, count)
      .timesSeries(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
      });
  });
});
