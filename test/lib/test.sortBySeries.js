'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('sortBySeries', () => {
  it('should execute in series', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.sortBySeries(collection, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.deepStrictEqual(res, [1, 2, 4]);
      assert.deepStrictEqual(order, [[0, 1], [1, 4], [2, 2]]);
    });
  });

  it('should execute on synchronous', () => {
    const collection = [1, 4, 2];
    const iterator = value => value * 2;
    return Aigle.sortBySeries(collection, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.deepStrictEqual(res, [1, 2, 4]);
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
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value);
        }, DELAY * value)
      );
    };
    return Aigle.sortBySeries(collection, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.deepStrictEqual(res, [1, 2, 4]);
      assert.deepStrictEqual(order, [['task1', 1], ['task2', 4], ['task3', 2]]);
    });
  });

  it('should return an empty array if collection is an empty array', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.sortBySeries([], iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 0);
    });
  });

  it('should return an empty array if collection is an empty object', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.sortBySeries({}, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 0);
    });
  });

  it('should return an empty array if collection is string', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.sortBySeries('test', iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 0);
    });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.sortBySeries(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#sortBySeries', () => {
  it('should execute in series', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value * 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .sortBySeries(iterator)
      .then(res => {
        assert.deepStrictEqual(res, [1, 2, 4]);
        assert.deepStrictEqual(order, [[0, 1], [1, 4], [2, 2]]);
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
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value * 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .sortBySeries(iterator)
      .then(res => {
        assert.deepStrictEqual(res, [1, 2, 4]);
        assert.deepStrictEqual(order, [['task1', 1], ['task2', 4], ['task3', 2]]);
      });
  });

  it('should execute with delay', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value * 2);
        }, DELAY * value)
      );
    };
    return Aigle.delay(DELAY, collection)
      .sortBySeries(iterator)
      .then(res => {
        assert.deepStrictEqual(res, [1, 2, 4]);
        assert.deepStrictEqual(order, [[0, 1], [1, 4], [2, 2]]);
      });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .sortBySeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});
