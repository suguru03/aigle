'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');

parallel('doWhilst', () => {

  it('should execute', () => {

    let count = 0;
    const limit = 5;
    const order = { test: [], iterator: [] };
    const test = () => {
      order.test.push(count);
      return count < limit;
    };
    const iterator = () => {
      order.iterator.push(count++);
      return new Aigle(resolve => setImmediate(resolve, count));
    };
    return Aigle.doWhilst(iterator, test)
      .then(res => {
        assert.deepStrictEqual(order.iterator, [0, 1, 2, 3, 4]);
        assert.deepStrictEqual(order.test, [1, 2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });

  it('should execute with initial value', () => {

    const value = 1;
    const limit = 5;
    const order = { test: [], iterator: [] };
    const test = value => {
      order.test.push(value);
      return value < limit;
    };
    const iterator = value => {
      order.iterator.push(value++);
      return new Aigle(resolve => setImmediate(resolve, value));
    };
    return Aigle.doWhilst(value, iterator, test)
      .then(res => {
        assert.deepStrictEqual(order.iterator, [1, 2, 3, 4]);
        assert.deepStrictEqual(order.test, [2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });

  it('should execute with synchronous function', () => {

    let sync = true;
    let count = 0;
    const test = str => str.length < 10;
    const iterator = str => str + count++;
    const promise = Aigle.doWhilst('num', iterator, test)
      .then(res => {
        assert.strictEqual(res, 'num0123456');
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should execute with an asynchronous test case', () => {

    let count = 0;
    const limit = 5;
    const order = { test: [], iterator: [] };
    const test = () => {
      order.test.push(count);
      return new Aigle(resolve => setImmediate(resolve, count < limit));
    };
    const iterator = () => {
      order.iterator.push(count++);
      return new Aigle(resolve => setImmediate(resolve, count));
    };
    return Aigle.doWhilst(iterator, test)
      .then(res => {
        assert.deepStrictEqual(order.iterator, [0, 1, 2, 3, 4]);
        assert.deepStrictEqual(order.test, [1, 2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });
});

parallel('#doWhilst', () => {

  it('should execute', () => {

    const value = 1;
    const limit = 5;
    const order = { test: [], iterator: [] };
    const test = value => {
      order.test.push(value);
      return value < limit;
    };
    const iterator = value => {
      order.iterator.push(value++);
      return new Aigle(resolve => setImmediate(resolve, value));
    };
    return Aigle.resolve(value)
      .doWhilst(iterator, test)
      .then(res => {
        assert.deepStrictEqual(order.iterator, [1, 2, 3, 4]);
        assert.deepStrictEqual(order.test, [2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });
});
