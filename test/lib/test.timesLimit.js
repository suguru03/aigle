'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('timesLimit', () => {

  it('should execute', () => {

    const count = 5;
    const iterator = n => {
      return new Aigle(resolve => setImmediate(() => resolve(n * 2)));
    };
    return Aigle.timesLimit(count, 2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
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
});

parallel('#timesLimit', () => {

  it('should execute', () => {

    const count = 5;
    const iterator = n => {
      return new Aigle(resolve => setImmediate(() => resolve(n * 2)));
    };
    return Aigle.resolve(count)
      .timesLimit(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepEqual(res, [0, 2, 4, 6, 8]);
      });
  });
});
