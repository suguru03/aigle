'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');

const Aigle = require('../proxy');
const { DELAY } = require('../config');

parallel('mapValuesSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.mapValuesSeries(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {
          '0': 2,
          '1': 8,
          '2': 4
        });
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });

  it('should execute with object collection in series', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.mapValuesSeries(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {
          task1: 2,
          task2: 8,
          task3: 4
        });
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4],
          ['task3', 2]
        ]);
      });
  });

  it('should return an empty object if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.mapValuesSeries([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should return an empty ojbect if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.mapValuesSeries({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should return an empty object if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.mapValuesSeries('test', iterator)
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
    return Aigle.mapValuesSeries(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#mapValuesSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .mapValuesSeries(iterator)
      .then(res => {
        assert.deepEqual(res, {
          '0': 2,
          '1': 8,
          '2': 4
        });
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });

  it('should execute with object collection in series', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .mapValuesSeries(iterator)
      .then(res => {
        assert.deepEqual(res, {
          task1: 2,
          task2: 8,
          task3: 4
        });
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4],
          ['task3', 2]
        ]);
      });
  });

  it('should execute with delay', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.delay(DELAY, collection)
      .mapValuesSeries(iterator)
      .then(res => {
        assert.deepEqual(res, {
          '0': 2,
          '1': 8,
          '2': 4
        });
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .mapValuesSeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

