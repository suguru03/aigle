'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('findKeySeries', () => {
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
    return Aigle.findKeySeries(collection, iterator).then(res => {
      assert.strictEqual(res, '0');
      assert.deepStrictEqual(order, [[0, 1]]);
    });
  });

  it('should execute on synchronous', () => {
    const collection = [1, 4, 2];
    const iterator = value => value % 2;
    return Aigle.findKeySeries(collection, iterator).then(res => assert.strictEqual(res, '0'));
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
    return Aigle.findKeySeries(collection, iterator).then(res => {
      assert.strictEqual(res, 'task1');
      assert.deepStrictEqual(order, [['task1', 1]]);
    });
  });

  it('should execute in series', () => {
    const order = [];
    const collection = [0, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(value % 2);
        }, DELAY * value)
      );
    };
    return Aigle.findKeySeries(collection, iterator).then(res => {
      assert.strictEqual(res, undefined);
      assert.deepStrictEqual(order, [[0, 0], [1, 4], [2, 2]]);
    });
  });

  it('should execute with object collection in series', () => {
    const order = [];
    const collection = {
      task1: 0,
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
    return Aigle.findKeySeries(collection, iterator).then(res => {
      assert.strictEqual(res, undefined);
      assert.deepStrictEqual(order, [['task1', 0], ['task2', 4], ['task3', 2]]);
    });
  });

  it('should return an empty array if collection is an empty array', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.findKeySeries([], iterator).then(res => assert.strictEqual(res, undefined));
  });

  it('should return an empty array if collection is an empty object', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.findKeySeries({}, iterator).then(res => assert.strictEqual(res, undefined));
  });

  it('should return an empty array if collection is string', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.findKeySeries('test', iterator).then(res => assert.strictEqual(res, undefined));
  });
  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.findKeySeries(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#findKeySeries', () => {
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
      .findKeySeries(iterator)
      .then(res => {
        assert.strictEqual(res, '0');
        assert.deepStrictEqual(order, [[0, 1]]);
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
      .findKeySeries(iterator)
      .then(res => {
        assert.strictEqual(res, 'task1');
        assert.deepStrictEqual(order, [['task1', 1]]);
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
      .findKeySeries(iterator)
      .then(res => {
        assert.strictEqual(res, '0');
        assert.deepStrictEqual(order, [[0, 1]]);
      });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .findKeySeries(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});
