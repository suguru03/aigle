'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');

parallel('doUntil', () => {

  it('should execute', () => {

    let count = 0;
    const limit = 5;
    const order = { test: [], iterator: [] };
    const test = () => {
      order.test.push(count);
      return count === limit;
    };
    const iterator = () => {
      order.iterator.push(count++);
      return new Aigle(resolve => process.nextTick(() => resolve(count)));
    };
    return Aigle.doUntil(iterator, test)
      .then(res => {
        assert.deepEqual(order.iterator, [0, 1, 2, 3, 4]);
        assert.deepEqual(order.test, [1, 2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });

  it('should execute with initial value', () => {

    const value = 1;
    const limit = 5;
    const order = { test: [], iterator: [] };
    const test = value => {
      order.test.push(value);
      return value === limit;
    };
    const iterator = value => {
      order.iterator.push(value++);
      return new Aigle(resolve => process.nextTick(() => resolve(value)));
    };
    return Aigle.doUntil(value, iterator, test)
      .then(res => {
        assert.deepEqual(order.iterator, [1, 2, 3, 4]);
        assert.deepEqual(order.test, [2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });

  it('should execute with synchronous function', () => {

    let sync = true;
    let count = 0;
    const test = str => str.length === 10;
    const iterator = str => str + count++;
    const promise = Aigle.doUntil('num', iterator, test)
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
      return new Aigle(resolve => process.nextTick(() => resolve(count === limit)));
    };
    const iterator = () => {
      order.iterator.push(count++);
      return new Aigle(resolve => process.nextTick(() => resolve(count)));
    };
    return Aigle.doUntil(iterator, test)
      .then(res => {
        assert.deepEqual(order.iterator, [0, 1, 2, 3, 4]);
        assert.deepEqual(order.test, [1, 2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });
});

parallel('#doUntil', () => {

  it('should execute', () => {

    const value = 1;
    const limit = 5;
    const order = { test: [], iterator: [] };
    const test = value => {
      order.test.push(value);
      return value === limit;
    };
    const iterator = value => {
      order.iterator.push(value++);
      return new Aigle(resolve => process.nextTick(() => resolve(value)));
    };
    return Aigle.resolve(value)
      .doUntil(iterator, test)
      .then(res => {
        assert.deepEqual(order.iterator, [1, 2, 3, 4]);
        assert.deepEqual(order.test, [2, 3, 4, 5]);
        assert.strictEqual(res, 5);
      });
  });
});
