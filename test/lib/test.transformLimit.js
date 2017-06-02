'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const { DELAY } = require('../config');
const { TimeoutError } = Aigle;

parallel('transformLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, iterator, [])
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 3, 5, 2, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5],
          [4, 2],
          [3, 4]
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
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, iterator, [])
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 3, 5, 2, 4]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5],
          ['task5', 2],
          ['task4', 4]
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

  it('should break if value is false', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve(value !== 5);
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 3, 5]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5]
        ]);
      });
  });

  it('should break if value is false', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 5,
      task3: 3,
      task4: 4,
      task5: 2
    };
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result[key] = value;
        resolve(value !== 5);
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {
          task1: 1,
          task2: 5,
          task3: 3
        });
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5]
        ]);
      });
  });

  it('should execute with default limit', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, iterator, [])
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 3, 4, 5]);
        assert.deepEqual(order, [
          [0, 1],
          [4, 2],
          [2, 3],
          [3, 4],
          [1, 5]
        ]);
      });
  });

  it('should execute with default limit', () => {

    const order = [];
    const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, iterator, [])
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 3, 4, 5]);
        assert.deepEqual(order, [
          ['a', 1],
          ['e', 2],
          ['c', 3],
          ['d', 4],
          ['b', 5]
        ]);
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

  it('should return an empty object if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformLimit({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should return an empty object if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.transformLimit('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should stop execution if error is caused', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle((resolve, reject) => setTimeout(() => {
        order.push([key, value]);
        value === 3 ? reject('error') : resolve(value);
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, iterator)
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
    const iterator = (result, value, key) => {
      return new Aigle((resolve, reject) => setTimeout(() => {
        order.push([key, value]);
        value === 3 ? reject('error') : resolve(value);
      }, DELAY * value));
    };
    return Aigle.transformLimit(collection, 2, iterator)
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

parallel('#transformLimit', () => {

  it('should execute', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
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
        assert.deepEqual(res, [1, 3, 5, 2, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5],
          [4, 2],
          [3, 4]
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
          task2: 5,
          task3: 3,
          task4: 4,
          task5: 2
        });
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5],
          ['task5', 2],
          ['task4', 4]
        ]);
      });
  });

  it('should execute with delay', () => {

    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        result.push(value);
        resolve();
      }, DELAY * value));
    };
    return Aigle.delay(DELAY, collection)
      .transformLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 3, 5, 2, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5],
          [4, 2],
          [3, 4]
        ]);
      });
  });

  it('should execute with default concurrency which is 8', () => {

    const collection = _.times(10);
    const order = [];
    const iterator = (result, value) => { order.push(value);
      return new Aigle(_.noop);
    };
    return Aigle.resolve(collection)
      .transformLimit(iterator)
      .timeout(DELAY)
      .catch(TimeoutError, error => error)
      .then(error => {
        assert.ok(error instanceof TimeoutError);
        assert.deepEqual(order, _.times(8));
      });
  });

  it('should catch a TypeError with delay', () => {

    const error = new TypeError('error');
    const iterator = () => {};
    return new Aigle((resolve, reject) => setTimeout(reject, DELAY, error))
      .transformLimit(iterator)
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
      promise.transformLimit(iterator)
        .then(() => assert(false))
        .catch(err => {
          assert.strictEqual(err, error);
          done();
        });
    });
  });
});
