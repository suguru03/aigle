'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('transformLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 4, 2, 1];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, [], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4, 1]);
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
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, [], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4, 1]);
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
    const iterator = (result, value) => {
      order.push(value);
      return new Aigle(_.noop);
    };
    Aigle.transformLimit(collection, iterator);
    return Aigle.delay(DELAY)
      .then(() => {
        assert.deepEqual(order, _.times(8));
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformLimit([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformLimit({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformLimit('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });
});

parallel('#transformLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 4, 2, 1];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .transformLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4, 1]);
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
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result[key] = value;
        resolve();
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .transformLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {
          task1: 1,
          task2: 4,
          task3: 2,
          task4: 1
        });
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4],
          ['task4', 1]
        ]);
      });
  });
});
