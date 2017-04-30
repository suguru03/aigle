'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('eachSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Aigle.eachSeries(collection, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
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
        return resolve(value);
      }, DELAY * value));
    };
    return Aigle.eachSeries(collection, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
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
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value !== 4);
      }, DELAY * value));
    };
    return Aigle.eachSeries(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
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
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value !== 4);
      }, DELAY * value));
    };
    return Aigle.eachSeries(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4]
        ]);
      });
  });

  it('should return undefined if collection is an empty array', () => {

    const iterator = value => value;
    return Aigle.eachSeries([], iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is an empty object', () => {

    const iterator = value => value;
    return Aigle.eachSeries({}, iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is an empty string', () => {

    const iterator = value => value;
    return Aigle.eachSeries('', iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should catch a Error', () => {

    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const error = new Error('error');
    const iterator = value => value === 2 ? Aigle.reject(error) :value;
    return Aigle.eachSeries(collection, iterator)
      .then(() => assert(false))
      .catch(err => assert.strictEqual(err, error));
  });
});

parallel('forEachSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Aigle.forEachSeries(collection, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });
});

parallel('#eachSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .eachSeries(iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
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
        return resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .eachSeries(iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4],
          ['task3', 2]
        ]);
      });
  });

  it('should catch an error with a reject promise', done => {

    process.on('unhandledRejection', done);
    const error = new Error('error');
    const promise = Aigle.reject(error);
    promise.catch(error => assert(error));
    const collection = [1, 4, 2];
    const iterator = () => promise;
    return Aigle.delay(DELAY, collection)
      .eachSeries(iterator)
      .then(() => assert(false))
      .catch(err => {
        assert.strictEqual(err, error);
        done();
      });
  });

  it('should catch a TypeError with delay', () => {

    const error = new TypeError('error');
    const iterator = () => {};
    return new Aigle((resolve, reject) => setTimeout(reject, DELAY, error))
      .eachSeries(iterator)
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
      promise.eachSeries(iterator)
        .then(() => assert(false))
        .catch(err => {
          assert.strictEqual(err, error);
          done();
        });
    });
  });
});

parallel('#forEachSeries', () => {

  it('should execute in series', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .forEachSeries(iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });
});
