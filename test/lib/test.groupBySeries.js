'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('groupBySeries', () => {
  it('should execute in series', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.groupBySeries(collection, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {
        '0': [4, 2],
        '1': [1]
      });
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
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.groupBySeries(collection, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {
        '0': [4, 2],
        '1': [1]
      });
      assert.deepStrictEqual(order, [['task1', 1], ['task2', 4], ['task3', 2]]);
    });
  });

  it('should return an empty object if collection is an empty array', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.groupBySeries([], iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {});
    });
  });

  it('should return an empty ojbect if collection is an empty object', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.groupBySeries({}, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {});
    });
  });

  it('should return an empty object if collection is string', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.groupBySeries('test', iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {});
    });
  });
  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.groupBySeries(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#groupBySeries', () => {
  it('should execute in series', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .groupBySeries(iterator)
      .then(res => {
        assert.deepStrictEqual(res, {
          '0': [4, 2],
          '1': [1]
        });
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
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .groupBySeries(iterator)
      .then(res => {
        assert.deepStrictEqual(res, {
          '0': [4, 2],
          '1': [1]
        });
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
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.delay(DELAY, collection)
      .groupBySeries(iterator)
      .then(res => {
        assert.deepStrictEqual(res, {
          '0': [4, 2],
          '1': [1]
        });
        assert.deepStrictEqual(order, [[0, 1], [1, 4], [2, 2]]);
      });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .groupBySeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});
