'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('map', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.map(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [2, 8, 4]);
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
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.map(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [2, 8, 4]);
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
    return Aigle.map([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.map({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.map('test', iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should execute using shorthand with array', () => {

    const collection = [{
      uid: 1, name: 'test1'
    }, {
      uid: 4, name: 'test4'
    }, {
      uid: 2, name: 'test2'
    }];
    let sync = true;
    const promise = Aigle.map(collection, 'uid')
      .then(array => {
        assert.deepEqual(array, [1, 4, 2]);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should execute using shorthand with object', () => {

    const collection = {
      task1: { uid: 1, name: 'test1' },
      task2: { uid: 4, name: 'test4' },
      task3: { uid: 2, name: 'test2' }
    };
    let sync = true;
    const promise = Aigle.map(collection, 'uid')
      .then(array => {
        assert.deepEqual(array, [1, 4, 2]);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should catch a TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.map(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#map', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .map(iterator)
      .then(res => {
        assert.deepEqual(res, [2, 8, 4]);
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
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .map(iterator)
      .then(res => {
        assert.deepEqual(res, [2, 8, 4]);
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
        resolve(value * 2);
      }, DELAY * value));
    };
    return Aigle.delay(DELAY, collection)
      .map(iterator)
      .then(res => {
        assert.deepEqual(res, [2, 8, 4]);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute using shorthand with an array', () => {

    const collection = [{
      uid: 1, name: 'test1'
    }, {
      uid: 4, name: 'test4'
    }, {
      uid: 2, name: 'test2'
    }];
    let sync = true;
    const promise = Aigle.resolve(collection)
      .map('uid')
      .then(array => {
        assert.deepEqual(array, [1, 4, 2]);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should execute using shorthand with an object', () => {

    const collection = {
      task1: { uid: 1, name: 'test1' },
      task2: { uid: 4, name: 'test4' },
      task3: { uid: 2, name: 'test2' }
    };
    let sync = true;
    const promise = Aigle.resolve(collection)
      .map('uid')
      .then(array => {
        assert.deepEqual(array, [1, 4, 2]);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should execute using array shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 }
    };
    return Aigle.resolve(collection)
      .groupBy(['bool', 1])
      .then(object => assert.deepEqual(object, {
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


  it('should execute using shorthand with an array of random parameters', () => {

    const collection = [{ uid: 1, name: 'test1'}, null, undefined, NaN];
    return Aigle.resolve(collection)
      .map('uid')
      .then(array => assert.deepEqual(array, [1, undefined, undefined, undefined]));
  });

  it('should execute using shorthand with an object of random parameters', () => {

    const collection = {
      task1: { uid: 1, name: 'test1' },
      task2: null,
      task3: undefined
    };
    return Aigle.resolve(collection)
      .map('uid')
      .then(array => assert.deepEqual(array, [1, undefined, undefined]));
  });

  it('should catch a TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .map(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

