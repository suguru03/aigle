'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('reduce', () => {
  it('should execute in series', () => {
    const order = [];
    const result = 'result';
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(result + value);
        }, DELAY * value)
      );
    };
    return Aigle.reduce(collection, iterator, result).then(res => {
      assert.strictEqual(res, 'result142');
      assert.deepStrictEqual(order, [[0, 1], [1, 4], [2, 2]]);
    });
  });

  it('should execute on synchronous', () => {
    const collection = [1, 4, 2];
    const result = 'result';
    const iterator = (result, value) => result + value;
    return Aigle.reduce(collection, iterator, result).then(res => assert.strictEqual(res, 'result142'));
  });

  it('should execute with object collection in series', () => {
    const order = [];
    const result = 'result';
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (result, value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(result + value);
        }, DELAY * value)
      );
    };
    return Aigle.reduce(collection, iterator, result).then(res => {
      assert.strictEqual(res, 'result142');
      assert.deepStrictEqual(order, [['task1', 1], ['task2', 4], ['task3', 2]]);
    });
  });

  it('should execute with two arguments', () => {
    const order = [];
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(result + value);
        }, DELAY * value)
      );
    };
    return Aigle.reduce(collection, iterator).then(res => {
      assert.strictEqual(res, 7);
      assert.deepStrictEqual(order, [[1, 4], [2, 2]]);
    });
  });

  it('should execute with two arguments', () => {
    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (result, value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(result + value);
        }, DELAY * value)
      );
    };
    return Aigle.reduce(collection, iterator).then(res => {
      assert.strictEqual(res, 7);
      assert.deepStrictEqual(order, [['task2', 4], ['task3', 2]]);
    });
  });

  it('should return result if collection is an empty array', () => {
    const result = 'result';
    const iterator = value => value.test();
    return Aigle.reduce([], iterator, result).then(res => assert.strictEqual(res, result));
  });

  it('should return result if collection is an empty object', () => {
    const result = 0;
    const iterator = value => value.test();
    return Aigle.reduce({}, iterator, result).then(res => assert.strictEqual(res, result));
  });

  it('should return result if collection is string', () => {
    const result = 'result';
    const iterator = value => value.test();
    return Aigle.reduce('test', iterator, result).then(res => assert.strictEqual(res, result));
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => value.test();
    return Aigle.reduce(collection, iterator)
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
    return Aigle.reduce(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#reduce', () => {
  it('should execute in series', () => {
    const order = [];
    const result = 'result';
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(result + value);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .reduce(iterator, result)
      .then(res => {
        assert.strictEqual(res, 'result142');
        assert.deepStrictEqual(order, [[0, 1], [1, 4], [2, 2]]);
      });
  });

  it('should execute with object collection in series', () => {
    const order = [];
    const result = 'result';
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (result, value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(result + value);
        }, DELAY * value)
      );
    };
    return Aigle.resolve(collection)
      .reduce(iterator, result)
      .then(res => {
        assert.strictEqual(res, 'result142');
        assert.deepStrictEqual(order, [['task1', 1], ['task2', 4], ['task3', 2]]);
      });
  });

  it('should execute with delay', () => {
    const order = [];
    const result = 'result';
    const collection = [1, 4, 2];
    const iterator = (result, value, key) => {
      return new Aigle(resolve =>
        setTimeout(() => {
          order.push([key, value]);
          resolve(result + value);
        }, DELAY * value)
      );
    };
    return Aigle.delay(DELAY, collection)
      .reduce(iterator, result)
      .then(res => {
        assert.strictEqual(res, 'result142');
        assert.deepStrictEqual(order, [[0, 1], [1, 4], [2, 2]]);
      });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => value.test();
    return Aigle.resolve(collection)
      .reduce(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});
