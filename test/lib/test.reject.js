'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const DELAY = require('../config').DELAY;

parallel('reject', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.reject(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [4, 2]);
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
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.reject(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [4, 2]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.reject([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.reject({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.reject('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.reject(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#reject', () => {

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
      .reject(iterator)
      .then(res => {
        assert.deepEqual(res, [4, 2]);
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
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .reject(iterator)
      .then(res => {
        assert.deepEqual(res, [4, 2]);
        assert.deepEqual(order, [
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
      .reject(iterator)
      .then(res => {
        assert.deepEqual(res, [4, 2]);
        assert.deepEqual(order, [
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
      .reject('bool')
      .then(array => {
        assert.deepEqual(array, [{
          uid: 1, bool: 0
        }]);
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
      .reject('bool')
      .then(array => {
        assert.deepEqual(array, [{
          uid: 1, bool: 0
        }]);
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
    }, null];
    return Aigle.resolve(collection)
      .reject(['uid', 4])
      .then(array => assert.deepEqual(array, [{
        uid: 1, bool: 0
      }, {
        uid: 2, bool: 1
      }, null]));
  });

  it('should execute using array shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 },
      task4: null
    };
    return Aigle.resolve(collection)
      .reject(['uid', 4])
      .then(array => assert.deepEqual(array, [{
        uid: 1, bool: 0
      }, {
        uid: 2, bool: 1
      }, null]));
  });

  it('should execute using object shorthand with array', () => {

    const collection = [{
      uid: 1, bool: 0
    }, {
      uid: 4, bool: 1
    }, {
      uid: 2, bool: 1
    }, null];
    return Aigle.resolve(collection)
      .reject({ uid: 4 })
      .then(array => assert.deepEqual(array, [{
        uid: 1, bool: 0
      }, {
        uid: 2, bool: 1
      }, null]));
  });

  it('should execute using object shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 },
      task4: null
    };
    return Aigle.resolve(collection)
      .reject({ uid: 4 })
      .then(array => assert.deepEqual(array, [{
        uid: 1, bool: 0
      }, {
        uid: 2, bool: 1
      }, null]));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .reject(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

