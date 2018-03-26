'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');

const Aigle = require('../../');
const util = require('../util');
const { DELAY } = require('../config');

parallel('race', () => {
  it('should execute', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [delay('test1', DELAY * 3), delay('test2', DELAY * 2), delay('test3', DELAY * 1)];
    return Aigle.race(tasks).then(res => {
      assert.strictEqual(res, 'test3');
      assert.deepStrictEqual(order, ['test3']);
    });
  });

  it('should execute with object tasks', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', DELAY * 3),
      task2: delay('test2', DELAY * 2),
      task3: delay('test3', DELAY * 1)
    };
    return Aigle.race(tasks).then(res => {
      assert.strictEqual(res, 'test3');
      assert.deepStrictEqual(order, ['test3']);
    });
  });

  it('should execute with a Set instance', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = new Set([delay('test1', DELAY * 3), delay('test2', DELAY * 2), delay('test3', DELAY * 1)]);
    return Aigle.race(tasks).then(res => {
      assert.strictEqual(res, 'test3');
      assert.deepStrictEqual(order, ['test3']);
    });
  });

  it('should execute with a Map instance', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = new Map([
      ['task1', delay('test1', DELAY * 3)],
      ['task2', delay('test2', DELAY * 2)],
      ['task3', delay('test3', DELAY * 1)]
    ]);
    return Aigle.race(tasks).then(res => {
      assert.strictEqual(res, 'test3');
      assert.deepStrictEqual(order, ['test3']);
    });
  });

  it('should be pending if tasks is an empty array', () => {
    let called = false;
    Aigle.race([]).then(() => (called = true));
    return Aigle.delay(DELAY).then(() => assert.strictEqual(called, false));
  });

  it('should be pending if tasks is an empty object', () => {
    let called = false;
    Aigle.race({}).then(() => (called = true));
    return Aigle.delay(DELAY).then(() => assert.strictEqual(called, false));
  });

  it('should return undefined if tasks is empty', () => {
    let called = false;
    Aigle.race().then(() => (called = true));
    return Aigle.delay(DELAY).then(() => assert.strictEqual(called, false));
  });

  it('should return a resolved promise', () => {
    return Aigle.race([Aigle.race(), Aigle.resolve(1), 2]).then(res => assert.strictEqual(res, 1));
  });

  it('should return a value', () => {
    return Aigle.race([Aigle.race(), 1, Aigle.resolve(2)]).then(res => assert.strictEqual(res, 1));
  });

  it('should catch an error', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', new Error('error1'), DELAY * 3),
      delay('test2', null, DELAY * 2),
      delay('test3', new Error('error3'), DELAY * 1)
    ];
    return Aigle.race(tasks)
      .then(() => assert(false))
      .catch(err => {
        assert.ok(err);
        assert.strictEqual(err.message, 'error3');
        assert.deepStrictEqual(order, ['test3']);
      });
  });

  it('should catch an error', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', new Error('error1'), DELAY * 3),
      task2: delay('test2', null, DELAY * 2),
      task3: delay('test3', new Error('error3'), DELAY * 1)
    };
    return Aigle.race(tasks)
      .then(() => assert(false))
      .catch(err => {
        assert.ok(err);
        assert.strictEqual(err.message, 'error3');
        assert.deepStrictEqual(order, ['test3']);
      });
  });
});

parallel('#race', () => {
  it('should execute', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [delay('test1', DELAY * 3), delay('test2', DELAY * 2), delay('test3', DELAY * 1)];
    return Aigle.resolve(tasks)
      .race()
      .then(res => {
        assert.strictEqual(res, 'test3');
        assert.deepStrictEqual(order, ['test3']);
      });
  });

  it('should return first object if previous promise is already resolved', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [delay('test1', DELAY * 3), delay('test2', DELAY * 2), delay('test3', DELAY * 1)];
    const promise = Aigle.resolve(tasks);
    return Aigle.delay(DELAY * 4)
      .then(() => promise.race())
      .then(value => assert.strictEqual(value, 'test1'));
  });

  it('should work with pending proimse', () => {
    const tasks = [Aigle.delay(DELAY * 4, 1), Aigle.delay(DELAY * 3, 2), Aigle.delay(DELAY * 2, 3)];
    return Aigle.delay(DELAY, tasks)
      .race()
      .then(res => assert.strictEqual(res, 3));
  });

  it('should catch an error', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', new Error('error1'), DELAY * 3),
      delay('test2', null, DELAY * 2),
      delay('test3', new Error('error3'), DELAY * 1)
    ];
    return Aigle.resolve(tasks)
      .race()
      .then(() => assert(false))
      .catch(err => {
        assert.ok(err);
        assert.strictEqual(err.message, 'error3');
        assert.deepStrictEqual(order, ['test3']);
      });
  });
});
