'use strict';
const assert = require('assert');
const parallel = require('mocha.parallel');

const Aigle = require('../proxy');
const { DELAY } = require('../config');

parallel('each', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute on synchronous', () => {

    const collection = [1, 4, 2];
    const iterator = value => value;
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
      });
  });

  it('should execute with object collection in parallel', () => {

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
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should break if value is false', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value !== 2);
      }, DELAY * value));
    };
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2]
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
        resolve(value !== 2);
      }, DELAY * value));
    };
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2]
        ]);
      });
  });

  it('should return undefined if collection is an empty array', () => {

    const iterator = value => value;
    return Aigle.each([], iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is an empty object', () => {

    const iterator = value => value;
    return Aigle.each({}, iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is an empty string', () => {

    const iterator = value => value;
    return Aigle.each('', iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.each(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });

  it('should throw TypeError', () => {

    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = value => value.test();
    return Aigle.each(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });

  it('should throw error if iterator returns an error promise', done => {

    process.on('unhandledRejection', done);
    const promise = Aigle.reject(1);
    const collection = [1, 4, 2];
    const iterator = () => promise;
    Aigle.each(collection, iterator)
      .catch(error => assert(error))
      .then(done);
  });
});

parallel('forEach', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.forEach(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });
});

parallel('#each', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .each(iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
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
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .each(iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should catch a TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .each(iterator)
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
      .each(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });

  it('should catch an error with a reject promise', done => {

    process.on('unhandledRejection', done);
    const error = new Error('error');
    const promise = Aigle.reject(error);
    promise.catch(error => assert(error));
    const collection = [1, 4, 2];
    const iterator = () => promise;
    Aigle.delay(DELAY, collection)
      .each(iterator)
      .then(() => assert(false))
      .catch(err => {
        assert.strictEqual(err, error);
        done();
      });
  });

  it('should not call each function if the parent promise is rejected', done => {

    process.on('unhandledRejection', done);
    const error = new Error('error');
    const promise = Aigle.reject(error);
    promise.catch(error => assert(error));
    const iterator = () => promise;
    setTimeout(() => {
      promise.each(iterator)
        .then(() => assert(false))
        .catch(err => {
          assert.strictEqual(err, error);
          done();
        });
    });
  });
});

parallel('#forEach', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .forEach(iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });
});
