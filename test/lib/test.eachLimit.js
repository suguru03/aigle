'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');

const Aigle = require('../../');
const { DELAY } = require('../config');
const { TimeoutError } = Aigle;

parallel('eachLimit', () => {
  it('should execute', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.eachLimit(collection, 2, iterator).then(res => {
      assert.deepStrictEqual(res, collection);
      assert.deepStrictEqual(order, [[0, 1], [2, 3], [1, 5], [4, 2], [3, 4]]);
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
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.eachLimit(collection, 2, iterator).then(res => {
      assert.deepStrictEqual(res, collection);
      assert.deepStrictEqual(order, [
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
    const iterator = value => {
      order.push(value);
      return new Aigle(_.noop);
    };
    Aigle.eachLimit(collection, iterator);
    return Aigle.delay(DELAY).then(() => {
      assert.deepStrictEqual(order, _.times(8));
    });
  });

  it('should break if value is false', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value !== 5);
        }, DELAY * value)
      );
    };
    return Aigle.eachLimit(collection, 2, iterator).then(res => {
      assert.deepStrictEqual(res, collection);
      assert.deepStrictEqual(order, [[0, 1], [2, 3], [1, 5]]);
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
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value !== 5);
        }, DELAY * value)
      );
    };
    return Aigle.eachLimit(collection, 2, iterator).then(res => {
      assert.deepStrictEqual(res, collection);
      assert.deepStrictEqual(order, [['task1', 1], ['task3', 3], ['task2', 5]]);
    });
  });

  it('should stop execution if error is caused', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle((resolve, reject) =>
        setTimeout(() => {
          order.push([key, value]);
          value === 3 ? reject('error') : resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.eachLimit(collection, 2, iterator)
      .catch(error => error)
      .delay(DELAY * 5)
      .then(res => {
        assert.deepStrictEqual(res, 'error');
        assert.deepStrictEqual(order, [[0, 1], [2, 3], [1, 5]]);
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
      return new Aigle((resolve, reject) =>
        setTimeout(() => {
          order.push([key, value]);
          value === 3 ? reject('error') : resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.eachLimit(collection, 2, iterator)
      .catch(error => error)
      .delay(DELAY * 5)
      .then(res => {
        assert.deepStrictEqual(res, 'error');
        assert.deepStrictEqual(order, [['task1', 1], ['task3', 3], ['task2', 5]]);
      });
  });

  it('should return the first argument if collection is an empty array', () => {
    const collection = [];
    const iterator = value => value;
    return Aigle.eachLimit(collection, iterator).then(res => assert.strictEqual(res, collection));
  });

  it('should return collection if collection is an empty object', () => {
    const collection = {};
    const iterator = value => value;
    return Aigle.eachLimit(collection, iterator).then(res => assert.strictEqual(res, collection));
  });

  it('should return collection if collection is an empty string', () => {
    const collection = '';
    const iterator = value => value;
    return Aigle.eachLimit(collection, iterator).then(res => assert.strictEqual(res, collection));
  });
});

parallel('forEachLimit', () => {
  it('should execute', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.forEachLimit(collection, 2, iterator).then(res => {
      assert.deepStrictEqual(res, collection);
      assert.deepStrictEqual(order, [[0, 1], [2, 3], [1, 5], [4, 2], [3, 4]]);
    });
  });
});

parallel('#eachLimit', () => {
  it('should execute', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .eachLimit(2, iterator)
      .then(res => {
        assert.deepStrictEqual(res, collection);
        assert.deepStrictEqual(order, [[0, 1], [2, 3], [1, 5], [4, 2], [3, 4]]);
      });
  });

  it('should execute on synchronous', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => order.push([key, value]);
    return Aigle.resolve(collection)
      .eachLimit(2, iterator)
      .then(res => {
        assert.deepStrictEqual(res, collection);
        assert.deepStrictEqual(order, [[0, 1], [1, 5], [2, 3], [3, 4], [4, 2]]);
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
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .eachLimit(2, iterator)
      .then(res => {
        assert.deepStrictEqual(res, collection);
        assert.deepStrictEqual(order, [
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
    const iterator = value => {
      order.push(value);
      return new Aigle(_.noop);
    };
    return Aigle.resolve(collection)
      .eachLimit(iterator)
      .timeout(DELAY)
      .catch(TimeoutError, error => error)
      .then(error => {
        assert.ok(error instanceof TimeoutError);
        assert.deepStrictEqual(order, _.times(8));
      });
  });

  it('should catch a TypeError with delay', () => {
    const error = new TypeError('error');
    const iterator = () => {};
    return new Aigle((resolve, reject) => setTimeout(reject, DELAY, error))
      .eachLimit(iterator)
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
      promise
        .eachLimit(iterator)
        .then(() => assert(false))
        .catch(err => {
          assert.strictEqual(err, error);
          done();
        });
    });
  });
});

parallel('#forEachLimit', () => {
  it('should execute', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .forEachLimit(2, iterator)
      .then(res => {
        assert.deepStrictEqual(res, collection);
        assert.deepStrictEqual(order, [[0, 1], [2, 3], [1, 5], [4, 2], [3, 4]]);
      });
  });
});
