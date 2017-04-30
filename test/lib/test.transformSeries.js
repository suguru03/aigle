'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('transformSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformSeries(collection, iterator, [])
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
    const iterator = (result, value) => result.push(value);
    return Aigle.transformSeries(collection, iterator, [])
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
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformSeries(collection, iterator, [])
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

  it('should break if value is false', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve(value !== 4);
      }, DELAY * value));
    };
    return Aigle.transformSeries(collection, iterator, [])
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [1, 4]
        ]);
      });
  });

  it('should break if value is false', () => {

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
        resolve(value !== 4);
      }, DELAY * value));
    };
    return Aigle.transformSeries(collection, iterator, [])
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 4]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4]
        ]);
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformSeries([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformSeries({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformSeries('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should catch TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.transformSeries(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#transformSeries', () => {

  it('should execute in series', () => {

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
      .transformSeries(iterator)
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
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result[key] = value;
        resolve();
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .transformSeries(iterator)
      .then(res => {
        assert.deepEqual(res, {
          task1: 1,
          task2: 4,
          task3: 2
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
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.delay(DELAY, collection)
      .transformSeries(iterator)
      .then(res => {
        assert.deepEqual(res, [1, 4, 2]);
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });

  it('should catch TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => value.test();
    return Aigle.resolve(collection)
      .transformSeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });

  it('should catch an error with object collection', () => {

    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = value => value.test();
    return Aigle.resolve(collection)
      .transformSeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });

  it('should catch a TypeError with delay', () => {

    const error = new TypeError('error');
    const iterator = () => {};
    return new Aigle((resolve, reject) => setTimeout(reject, DELAY, error))
      .transformSeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });

  it('should not call each function if the parent promise is rejected', done => {

    process.on('unhandledRejection', done);
    const error = new Error('error');
    const promise = Aigle.reject(error);
    promise.catch(error => assert(error));
    const iterator = () => promise;
    setTimeout(() => {
      promise.transformSeries(iterator)
        .then(() => assert(false))
        .catch(err => {
          assert.strictEqual(err, error);
          done();
        });
    });
  });
});

