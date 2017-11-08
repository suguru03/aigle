'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('groupBy', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.groupBy(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {
          '0': [2, 4],
          '1': [1]
        });
        assert.deepStrictEqual(order, [
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
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.groupBy(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {
          '0': [2, 4],
          '1': [1]
        });
        assert.deepStrictEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should return an empty object if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.groupBy([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {});
      });
  });

  it('should return an empty ojbect if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.groupBy({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {});
      });
  });

  it('should return an empty object if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.groupBy('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepStrictEqual(res, {});
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.groupBy(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#groupBy', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .groupBy(iterator)
      .then(res => {
        assert.deepStrictEqual(res, {
          '0': [2, 4],
          '1': [1]
        });
        assert.deepStrictEqual(order, [
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
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .groupBy(iterator)
      .then(res => {
        assert.deepStrictEqual(res, {
          '0': [2, 4],
          '1': [1]
        });
        assert.deepStrictEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should execute with delay', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.delay(DELAY, collection)
      .groupBy(iterator)
      .then(res => {
        assert.deepStrictEqual(res, {
          '0': [2, 4],
          '1': [1]
        });
        assert.deepStrictEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute using string shorthand with array', () => {

    const collection = [{
      uid: 1, bool: 0
    }, {
      uid: 4, bool: 1
    }, {
      uid: 2, bool: 1
    }];
    let sync = true;
    const promise = Aigle.resolve(collection)
      .groupBy('bool')
      .then(object => {
        assert.deepStrictEqual(object, {
          '0': [{
            uid: 1, bool: 0
          }],
          '1': [{
            uid: 4, bool: 1
          }, {
            uid: 2, bool: 1
          }]
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
      .groupBy('bool')
      .then(object => {
        assert.deepStrictEqual(object, {
          '0': [{
            uid: 1, bool: 0
          }],
          '1': [{
            uid: 4, bool: 1
          }, {
            uid: 2, bool: 1
          }]
        });
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should execute using array shorthand with array', () => {

    const collection = [{
      uid: 1, bool: 0
    }, {
      uid: 4, bool: 1
    }, {
      uid: 2, bool: 1
    }];
    return Aigle.resolve(collection)
      .groupBy(['bool', 1])
      .then(object => assert.deepStrictEqual(object, {
        'true': [{
          uid: 4, bool: 1
        }, {
          uid: 2, bool: 1
        }],
        'false': [{
          uid: 1, bool: 0
        }]
      }));
  });

  it('should execute using array shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 }
    };
    return Aigle.resolve(collection)
      .groupBy(['bool', 1])
      .then(object => assert.deepStrictEqual(object, {
        'true': [{
          uid: 4, bool: 1
        }, {
          uid: 2, bool: 1
        }],
        'false': [{
          uid: 1, bool: 0
        }]
      }));
  });

  it('should execute using object shorthand with array', () => {

    const collection = [{
      uid: 1, bool: 0
    }, {
      uid: 4, bool: 1
    }, {
      uid: 2, bool: 1
    }];
    return Aigle.resolve(collection)
      .groupBy({ bool: 0 })
      .then(object => assert.deepStrictEqual(object, {
        'true': [{
          uid: 1, bool: 0
        }],
        'false': [{
          uid: 4, bool: 1
        }, {
          uid: 2, bool: 1
        }]
      }));
  });

  it('should execute using object shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 }
    };
    return Aigle.resolve(collection)
      .groupBy({ bool: 0 })
      .then(object => assert.deepStrictEqual(object, {
        'true': [{
          uid: 1, bool: 0
        }],
        'false': [{
          uid: 4, bool: 1
        }, {
          uid: 2, bool: 1
        }]
      }));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .groupBy(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

