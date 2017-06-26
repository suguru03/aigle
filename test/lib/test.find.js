'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('find', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.find(collection, iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          [0, 1]
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
    return Aigle.find(collection, iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          ['task1', 1]
        ]);
      });
  });

  it('should execute in parallel', () => {

    const order = [];
    const collection = [0, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.find(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 0],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute with object collection in parallel', () => {

    const order = [];
    const collection = {
      task1: 0,
      task2: 4,
      task3: 2
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value % 2);
      }, DELAY * value));
    };
    return Aigle.find(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 0],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should return undefined if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.find([], iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.find({}, iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is string', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.find('test', iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.find(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#find', () => {

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
      .find(iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          [0, 1]
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
      .find(iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          ['task1', 1]
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
      .find(iterator)
      .then(res => {
        assert.strictEqual(res, 1);
        assert.deepEqual(order, [
          [0, 1]
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
      .find('bool')
      .then(res => {
        assert.deepEqual(res, { uid: 4, bool: 1 });
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
      .find('bool')
      .then(res => {
        assert.deepEqual(res, { uid: 4, bool: 1 });
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
      .find(['bool', 1])
      .then(res => assert.deepEqual(res, {
        uid: 4, bool: 1
      }));
  });

  it('should execute using array shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 }
    };
    return Aigle.resolve(collection)
      .find(['uid', 2])
      .then(res => assert.deepEqual(res, {
        uid: 2, bool: 1
      }));
  });

  it('should execute using object shorthand with array', () => {

    const collection = [{
      uid: 1, bool: 1
    }, {
      uid: 4, bool: 1
    }, {
      uid: 2, bool: 1
    }];
    return Aigle.resolve(collection)
      .find({ uid: 2 })
      .then(res => assert.deepEqual(res, {
        uid: 2, bool: 1
      }));
  });

  it('should execute using object shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 }
    };
    return Aigle.resolve(collection)
      .find({ uid: 4, bool: 1 })
      .then(res => assert.deepEqual(res, {
        uid: 4, bool: 1
      }));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .find(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

