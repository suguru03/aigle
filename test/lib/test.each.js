'use strict';
const assert = require('assert'); const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('each', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });

  it('should execute on synchronous', () => {

    const collection = [1, 4, 2];
    const iterator = value => value;
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
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
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should break if value is false', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value !== 2);
      }, DELAY * value));
    };
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2]
        ]);
      });
  });

  it('should break if value is false', () => {

    const order = [];
    const collection = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value !== 2);
      }, DELAY * value));
    };
    return Aigle.each(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2]
        ]);
      });
  });

  it('should return undefined if collection is an empty array', () => {

    const iterator = value => value;
    return Aigle.each([], iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is an empty object', () => {

    const iterator = value => value;
    return Aigle.each({}, iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if collection is an empty string', () => {

    const iterator = value => value;
    return Aigle.each('', iterator)
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.each(collection, iterator)
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
    return Aigle.each(collection, iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('forEach', () => {

  it('should execute in parallel', () => {

    const order = [];
    const collection = [1, 4, 2];
    const iterator = (value, key) => {
      return new Aigle(resolve => setTimeout(() => {
        order.push([key, value]);
        resolve(value);
      }, DELAY * value));
    };
    return Aigle.forEach(collection, iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });
});

parallel('#each', () => {

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
      .each(iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
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
      .each(iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4]
        ]);
      });
  });

  it('should throw TypeError', () => {

    const collection = [1, 4, 2];
    const iterator = value => {
      value.test();
    };
    return Aigle.resolve(collection)
      .each(iterator)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#forEach', () => {

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
      .forEach(iterator)
      .then(res => {
        assert.strictEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4]
        ]);
      });
  });
});
