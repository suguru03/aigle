'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('everySeries', () => {
  it('should execute in series', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle((resolve) =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.everySeries(collection, iterator).then((res) => {
      assert.strictEqual(res, false);
      assert.deepStrictEqual(order, [
        [0, 1],
        [1, 4],
      ]);
    });
  });

  it('should execute on synchronous', () => {
    const collection = [1, 4, 2];
    const iterator = (value) => value % 2;
    return Aigle.everySeries(collection, iterator).then((res) => assert.strictEqual(res, false));
  });

  it('should execute with object collection in series', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2,
    };
    const iterator = (value, key, coll) => {
      assert.strictEqual(coll, collection);
      return new Aigle((resolve) =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.everySeries(collection, iterator).then((res) => {
      assert.strictEqual(res, false);
      assert.deepStrictEqual(order, [
        ['task1', 1],
        ['task2', 4],
      ]);
    });
  });

  it('should execute in series', () => {
    const order = [];
    const collection = [1, 5, 3];
    const iterator = (value, key) => {
      return new Aigle((resolve) =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.everySeries(collection, iterator).then((res) => {
      assert.strictEqual(res, true);
      assert.deepStrictEqual(order, [
        [0, 1],
        [1, 5],
        [2, 3],
      ]);
    });
  });

  it('should execute with object collection in series', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 5,
      task3: 3,
    };
    const iterator = (value, key) => {
      return new Aigle((resolve) =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.everySeries(collection, iterator).then((res) => {
      assert.strictEqual(res, true);
      assert.deepStrictEqual(order, [
        ['task1', 1],
        ['task2', 5],
        ['task3', 3],
      ]);
    });
  });

  it('should return an empty array if collection is an empty array', () => {
    const iterator = (value) => {
      value.test();
    };
    return Aigle.everySeries([], iterator).then((res) => assert.strictEqual(res, true));
  });

  it('should return an empty array if collection is an empty object', () => {
    const iterator = (value) => {
      value.test();
    };
    return Aigle.everySeries({}, iterator).then((res) => assert.strictEqual(res, true));
  });

  it('should return an empty array if collection is string', () => {
    const iterator = (value) => {
      value.test();
    };
    return Aigle.everySeries('test', iterator).then((res) => assert.strictEqual(res, true));
  });
  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = (value) => {
      value.test();
    };
    return Aigle.everySeries(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, (error) => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#everySeries', () => {
  it('should execute in series', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle((resolve) =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .everySeries(iterator)
      .then((res) => {
        assert.strictEqual(res, false);
        assert.deepStrictEqual(order, [
          [0, 1],
          [1, 4],
        ]);
      });
  });

  it('should execute with object collection in series', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2,
    };
    const iterator = (value, key) => {
      return new Aigle((resolve) =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .everySeries(iterator)
      .then((res) => {
        assert.strictEqual(res, false);
        assert.deepStrictEqual(order, [
          ['task1', 1],
          ['task2', 4],
        ]);
      });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = (value) => {
      value.test();
    };
    return Aigle.resolve(collection)
      .everySeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, (error) => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});
