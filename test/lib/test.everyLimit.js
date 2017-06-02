'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const { DELAY } = require('../config');
const { TimeoutError } = Aigle;

parallel('everyLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.everyLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5],
          [4, 2]
        ]);
      });
  });

  it('should execute with object collection', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 5,
      task3: 3,
      task4: 4,
      task5: 2
    };
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.everyLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5],
          ['task5', 2]
        ]);
      });
  });

  it('should execute', () => {

    const order = [];
    const collection = [1, 5, 3];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.everyLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(res, true);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5]
        ]);
      });
  });

  it('should execute with object collection', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 5,
      task3: 3
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.everyLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(res, true);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5]
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
    Aigle.everyLimit(collection, iterator);
    return Aigle.delay(DELAY)
      .then(() => {
        assert.deepEqual(order, _.times(8));
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.everyLimit([], iterator)
      .then(res => assert.strictEqual(res, true));
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.everyLimit({}, iterator)
      .then(res => assert.strictEqual(res, true));
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.everyLimit('test', iterator)
      .then(res => assert.strictEqual(res, true));
  });

  it('should stop execution if error is caused', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle((resolve, reject) => setTimeout(() => {
        order.push([key, value]);
        value === 3 ? reject('error') : resolve(value);
      }, DELAY * value));
    };
    return Aigle.everyLimit(collection, 2, iterator)
      .catch(error => error)
      .delay(DELAY * 5)
      .then(res => {
        assert.deepEqual(res, 'error');
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5]
        ]);
      });
  });

  it('should stop execution if error is caused', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 5,
      task3: 3,
      task4: 4,
      task5: 2
    };
    const iterator = (value, key) => {
      return new Aigle((resolve, reject) => setTimeout(() => {
        order.push([key, value]);
        value === 3 ? reject('error') : resolve(value);
      }, DELAY * value));
    };
    return Aigle.everyLimit(collection, 2, iterator)
      .catch(error => error)
      .delay(DELAY * 5)
      .then(res => {
        assert.deepEqual(res, 'error');
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5]
        ]);
      });
  });
});

parallel('#everyLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .everyLimit(2, iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5],
          [4, 2]
        ]);
      });
  });

  it('should execute with object collection', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 5,
      task3: 3,
      task4: 4,
      task5: 2
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .everyLimit(2, iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5],
          ['task5', 2]
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
    return Aigle.resolve(collection)
      .everyLimit(iterator)
      .timeout(DELAY)
      .catch(TimeoutError, error => error)
      .then(error => {
        assert.ok(error instanceof TimeoutError);
        assert.deepEqual(order, _.times(8));
      });
  });
});
