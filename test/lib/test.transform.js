'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('transform', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transform(collection, [], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute with object collection in parallel', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transform(collection, [], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should execute without accumulator', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transform(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute with object collection witout accumulator', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result[key] = value;
        resolve();
      }, DELAY * value));
    };
    return Aigle.transform(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {
          'task1': 1,
          'task2': 4,
          'task3': 2
        });
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transform([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty object if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transform({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transform('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.transform(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#transform', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .transform(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute with object collection in parallel', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result[key] = value;
        resolve();
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .transform(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {
          'task1': 1,
          'task2': 4,
          'task3': 2
        });
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .transform(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

