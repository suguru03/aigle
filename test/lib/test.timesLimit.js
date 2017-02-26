'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('timesLimit', () => {

  it('should execute', () => {

    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 === 0 ? DELAY : 3 * DELAY;
      return new Aigle(resolve => setTimeout(() => {
        order.push(n);
        resolve(n * 2);
      }, delay));
    };
    return Aigle.timesLimit(count, 2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
        assert.deepEqual(order, [0, 2, 1, 4, 3]);
      });
  });

  it('should execute with synchronous function', () => {

    const count = 5;
    const iterator = n => n * 2;
    return Aigle.timesLimit(count, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
      });
  });

  it('should execute with default concurrency which is 8', () => {

    const order = [];
    const iterator = value => {
      order.push(value);
      return new Aigle(_.noop);
    };
    Aigle.timesLimit(10, iterator);
    return Aigle.delay(DELAY)
      .then(() => {
        assert.deepEqual(order, _.times(8));
      });
  });

  it('should stop execution if error is caused', () => {

    const order = [];
    const iterator = value => {
      return new Aigle((resolve, reject) => {
        order.push(value);
        value === 3 ? reject('error') : resolve(value);
      });
    };
    return Aigle.timesLimit(10, 2, iterator)
      .catch(error => error)
      .delay(DELAY)
      .then(res => {
        assert.strictEqual(res, 'error');
        assert.deepEqual(order, _.times(5));
      });
  });

  it('should return an empty array if times is not number', () => {

    const iterator = n => n * 2;
    return Aigle.timesLimit('test', 'test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });
});

parallel('#timesLimit', () => {

  it('should execute', () => {

    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 === 0 ? DELAY : 3 * DELAY;
      return new Aigle(resolve => setTimeout(() => {
        order.push(n);
        resolve(n * 2);
      }, delay));
    };
    return Aigle.resolve(count)
      .timesLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
        assert.deepEqual(order, [0, 2, 1, 4, 3]);
      });
  });
});
