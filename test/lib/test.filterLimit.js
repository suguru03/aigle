'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('filterLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 4, 2, 1];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.filterLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 1]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4],
          [3, 1]
        ]);
      });
  });

  it('should execute with object collection', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2,
      task4: 1
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.filterLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 1]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4],
          ['task4', 1]
        ]);
      });
  });

  it('should execute with default concurrency which is 8', () => {

    const collection = _.times(10);
    const order = [];
    const iterator = value => {
      order.push(value);
      return new Aigle(_.noop);
    };
    Aigle.filterLimit(collection, iterator);
    return Aigle.delay(DELAY)
      .then(() => {
        assert.deepEqual(order, _.times(8));
      });
  });
});

parallel('#filterLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 4, 2, 1];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .filterLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 1]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4],
          [3, 1]
        ]);
      });
  });

  it('should execute with object collection', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2,
      task4: 1
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .filterLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 1]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4],
          ['task4', 1]
        ]);
      });
  });
});
