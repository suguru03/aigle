'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const DELAY = require('../config').DELAY;

parallel('concatSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve([value]);
      }, DELAY * value));
    };
    return Aigle.concatSeries(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 4, 2]);
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });

  it('should execute on synchronous', () => {

    const collection = [1, 4, 2];
    const iterator = value => [value];
    return Aigle.concatSeries(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 4, 2]);
      });
  });

  it('should execute with object collection in series', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve([value]);
      }, DELAY * value));
    };
    return Aigle.concatSeries(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 4, 2]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4],
          ['task3', 2]
        ]);
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.concatSeries([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.concatSeries({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.concatSeries('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.concatSeries(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#concatSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .concatSeries(iterator)
      .then(res => {
        assert.deepEqual(res, [1, 4, 2]);
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
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .concatSeries(iterator)
      .then(res => {
        assert.deepEqual(res, [1, 4, 2]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4],
          ['task3', 2]
        ]);
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .concatSeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});
