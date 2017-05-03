'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('every', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.every(collection, iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2]
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
    return Aigle.every(collection, iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2]
        ]);
      });
  });

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 5, 3];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.every(collection, iterator)
      .then(res => {
        assert.strictEqual(res, true);
        assert.deepEqual(order, [
          [0, 1],
          [2, 3],
          [1, 5]
        ]);
      });
  });

  it('should execute with object collection in parallel', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 5,
      task3: 3
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.every(collection, iterator)
      .then(res => {
        assert.strictEqual(res, true);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 3],
          ['task2', 5]
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
    const promise = Aigle.every(collection, 'test')
      .then(bool => {
        assert.strictEqual(bool, false);
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
    const promise = Aigle.every(collection, 'test')
      .then(bool => {
        assert.strictEqual(bool, false);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should return true if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.every([], iterator)
      .then(res => assert.strictEqual(res, true));
  });

  it('should return true if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.every({}, iterator)
      .then(res => assert.strictEqual(res, true));
  });

  it('should return true if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.every('test', iterator)
      .then(res => assert.strictEqual(res, true));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.every(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#every', () => {

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
      .every(iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2]
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
      .every(iterator)
      .then(res => {
        assert.strictEqual(res, false);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2]
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
      .every('test')
      .then(bool => {
        assert.strictEqual(bool, false);
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
      .every('test')
      .then(bool => {
        assert.strictEqual(bool, false);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .every(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

