'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');
const { TimeoutError } = Aigle;

parallel('rejectLimit', () => {
  it('should execute', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.rejectLimit(collection, 2, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.deepStrictEqual(res, [4, 2]);
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
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.rejectLimit(collection, 2, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.deepStrictEqual(res, [4, 2]);
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
    Aigle.rejectLimit(collection, iterator);
    return Aigle.delay(DELAY).then(() => {
      assert.deepStrictEqual(order, _.times(8));
    });
  });

  it('should return an empty array if collection is an empty array', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.rejectLimit([], iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 0);
    });
  });

  it('should return an empty array if collection is an empty object', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.rejectLimit({}, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 0);
    });
  });

  it('should return an empty array if collection is string', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.rejectLimit('test', iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 0);
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
    return Aigle.rejectLimit(collection, 2, iterator)
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
    return Aigle.rejectLimit(collection, 2, iterator)
      .catch(error => error)
      .delay(DELAY * 5)
      .then(res => {
        assert.deepStrictEqual(res, 'error');
        assert.deepStrictEqual(order, [['task1', 1], ['task3', 3], ['task2', 5]]);
      });
  });
});

parallel('#rejectLimit', () => {
  it('should execute', () => {
    const order = [];
    const collection = [1, 5, 3, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .rejectLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepStrictEqual(res, [4, 2]);
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
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .rejectLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepStrictEqual(res, [4, 2]);
        assert.deepStrictEqual(order, [
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
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.delay(DELAY, collection)
      .rejectLimit(2, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepStrictEqual(res, [4, 2]);
        assert.deepStrictEqual(order, [[0, 1], [2, 3], [1, 5], [4, 2], [3, 4]]);
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
      .rejectLimit(iterator)
      .timeout(DELAY)
      .catch(TimeoutError, error => error)
      .then(error => {
        assert.ok(error instanceof TimeoutError);
        assert.deepStrictEqual(order, _.times(8));
      });
  });
});
