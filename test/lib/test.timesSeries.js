'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('timesSeries', () => {

  it('should execute', () => {

    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 ? (n + 5) * DELAY : (n + 1) * DELAY;
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
});

parallel('#timesSeries', () => {

  it('should execute', () => {

    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 ? (n + 5) * DELAY : (n + 1) * DELAY;
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
});
