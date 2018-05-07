'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('pick', () => {
  it('should execute in parallel', () => {
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
    return Aigle.pick(collection, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {
        '0': 1
      });
      assert.deepStrictEqual(order, [[0, 1], [2, 2], [1, 4]]);
    });
  });

  it('should execute with object collection in parallel', () => {
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
    return Aigle.pick(collection, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {
        task1: 1
      });
      assert.deepStrictEqual(order, [['task1', 1], ['task3', 2], ['task2', 4]]);
    });
  });

  it('should return an empty array if collection is an empty array', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.pick([], iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {});
    });
  });

  it('should return an empty array if collection is an empty object', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.pick({}, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {});
    });
  });

  it('should return an empty array if collection is string', () => {
    const iterator = value => {
      value.test();
    };
    return Aigle.pick('test', iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {});
    });
  });

  it('should execute using string shorthand with array', () => {
    const collection = [
      {
        uid: 1,
        bool: 0
      },
      {
        uid: 4,
        bool: 1
      },
      {
        uid: 2,
        bool: 1
      }
    ];
    let sync = true;
    const promise = Aigle.pick(collection, '1').then(object => {
      assert.deepStrictEqual(object, {
        '1': {
          uid: 4,
          bool: 1
        }
      });
      assert.strictEqual(sync, false);
    });
    sync = false;
    return promise;
  });

  it('should execute using string shorthand with object', () => {
    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 }
    };
    let sync = true;
    const promise = Aigle.pick(collection, 'task2').then(object => {
      assert.deepStrictEqual(object, {
        task2: {
          uid: 4,
          bool: 1
        }
      });
      assert.strictEqual(sync, false);
    });
    sync = false;
    return promise;
  });

  it('should work with arguments', () => {
    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 },
      task4: { uid: 3, bool: 1 }
    };
    return Aigle.pick(collection, ['task1', 'task3'], 'task2').then(object => {
      assert.deepStrictEqual(object, {
        task1: { uid: 1, bool: 0 },
        task2: { uid: 4, bool: 1 },
        task3: { uid: 2, bool: 1 }
      });
    });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.pick(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#pick', () => {
  it('should execute in parallel', () => {
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
      .pick(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {
          '0': 1
        });
        assert.deepStrictEqual(order, [[0, 1], [2, 2], [1, 4]]);
      });
  });

  it('should execute with object collection in parallel', () => {
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
      .pick(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {
          task1: 1
        });
        assert.deepStrictEqual(order, [['task1', 1], ['task3', 2], ['task2', 4]]);
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
      .pick(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {
          '0': 1
        });
        assert.deepStrictEqual(order, [[0, 1], [2, 2], [1, 4]]);
      });
  });

  it('should execute using string shorthand with array', () => {
    const collection = [
      {
        uid: 1,
        bool: 0
      },
      {
        uid: 4,
        bool: 1
      },
      {
        uid: 2,
        bool: 1
      }
    ];
    let sync = true;
    const promise = Aigle.resolve(collection)
      .pick('1')
      .then(object => {
        assert.deepStrictEqual(object, {
          '1': {
            uid: 4,
            bool: 1
          }
        });
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should execute using string shorthand with object', () => {
    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 }
    };
    let sync = true;
    const promise = Aigle.resolve(collection)
      .pick('task2')
      .then(object => {
        assert.deepStrictEqual(object, {
          task2: {
            uid: 4,
            bool: 1
          }
        });
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should work with arguments', () => {
    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 },
      task4: { uid: 3, bool: 1 }
    };
    return Aigle.resolve(collection)
      .pick(['task1', 'task3'], 'task2')
      .then(object => {
        assert.deepStrictEqual(object, {
          task1: { uid: 1, bool: 0 },
          task2: { uid: 4, bool: 1 },
          task3: { uid: 2, bool: 1 }
        });
      });
  });

  it('should throw TypeError', () => {
    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .pick(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});
