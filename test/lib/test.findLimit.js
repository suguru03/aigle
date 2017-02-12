'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('findLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 4, 2, 1];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.findLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          [0, 1]
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
    return Aigle.findLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          ['task1', 1]
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
    Aigle.findLimit(collection, iterator);
    return Aigle.delay(DELAY)
      .then(() => {
        assert.deepEqual(order, _.times(8));
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.findLimit([], iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.findLimit({}, iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.findLimit('test', iterator)
      .then(res => assert.strictEqual(res, undefined));
  });
});

parallel('#findLimit', () => {

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
      .findLimit(2, iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          [0, 1]
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
      .findLimit(2, iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          ['task1', 1]
        ]);
      });
  });
});
