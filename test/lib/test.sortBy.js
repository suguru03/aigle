'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('sortBy', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.sortBy(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4]);
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
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.sortBy(collection, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, [1, 2, 4]);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should keep the order if the criteria are same', () => {
    const collection = [{
      index: 0,
      value: 4
    }, {
      index: 1,
      value: 3
    }, {
      index: 2,
      value: 2
    }, {
      index: 3,
      value: 1
    }, {
      index: 4,
      value: 0
    }];
    const iterator = ({ value }) => value % 2 === 0;
    return Aigle.sortBy(collection, iterator)
      .then(res => {
        assert.deepEqual(res, [{
          index: 1,
          value: 3
        }, {
          index: 3,
          value: 1
        }, {
          index: 0,
          value: 4
        }, {
          index: 2,
          value: 2
        }, {
          index: 4,
          value: 0
        }]);
      });
  });

  it('should return an empty array if collection is an empty array', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.sortBy([], iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

  it('should return an empty array if collection is an empty object', () => {

    const iterator = value => {
      value.test();
    };
    return Aigle.sortBy({}, iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, 0);
      });
  });

    it('should return an empty array if collection is string', () => {

      const iterator = value => {
        value.test();
      };
      return Aigle.sortBy('test', iterator)
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
      return Aigle.sortBy(collection, iterator)
        .then(() => assert.ok(false))
        .catch(TypeError, error => {
          assert.ok(error);
          assert.ok(error instanceof TypeError);
        });
    });
  });

parallel('#sortBy', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .sortBy(iterator)
      .then(res => {
        assert.deepEqual(res, [1, 2, 4]);
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
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.resolve(collection)
      .sortBy(iterator)
      .then(res => {
        assert.deepEqual(res, [1, 2, 4]);
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
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.delay(DELAY, collection)
      .sortBy(iterator)
      .then(res => {
        assert.deepEqual(res, [1, 2, 4]);
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
      .sortBy('uid')
      .then(array => {
        assert.deepEqual(array, [{
          uid: 1, name: 'test1'
        }, {
          uid: 2, name: 'test2'
        }, {
          uid: 4, name: 'test4'
        }]);
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
      .sortBy('uid')
      .then(array => {
        assert.deepEqual(array, [{
          uid: 1, name: 'test1'
        }, {
          uid: 2, name: 'test2'
        }, {
          uid: 4, name: 'test4'
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
      .filter(['uid', 4])
      .then(array => assert.deepEqual(array, [{
        uid: 4, bool: 1
      }]));
  });

  it('should execute using array shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 },
      task4: null
    };
    return Aigle.resolve(collection)
      .filter(['uid', 4])
      .then(array => assert.deepEqual(array, [{
        uid: 4, bool: 1
      }]));
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
      .filter({ uid: 4 })
      .then(array => assert.deepEqual(array, [{
        uid: 4, bool: 1
      }]));
  });

  it('should execute using object shorthand with object', () => {

    const collection = {
      task1: { uid: 1, bool: 0 },
      task2: { uid: 4, bool: 1 },
      task3: { uid: 2, bool: 1 },
      task4: null
    };
    return Aigle.resolve(collection)
      .filter({ uid: 4 })
      .then(array => assert.deepEqual(array, [{
        uid: 4, bool: 1
      }]));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .sortBy(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

