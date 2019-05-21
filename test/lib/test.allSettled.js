'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const util = require('../util');
const { DELAY } = require('../config');

parallel('allSettled', () => {
  it('should execute in parallel', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [delay('test1', DELAY * 3), delay('test2', DELAY * 2), delay('test3', DELAY * 1)];
    return Aigle.allSettled(tasks).then(res => {
      assert.deepStrictEqual(res, [
        { state: 'fulfilled', value: 'test1' },
        { state: 'fulfilled', value: 'test2' },
        { state: 'fulfilled', value: 'test3' }
      ]);
      assert.deepStrictEqual(order, ['test3', 'test2', 'test1']);
    });
  });

  it('should execute with object tasks in parallel', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', DELAY * 3),
      task2: delay('test2', DELAY * 2),
      task3: delay('test3', DELAY * 1)
    };
    return Aigle.allSettled(tasks).then(res => {
      assert.deepStrictEqual(res, {
        task1: { state: 'fulfilled', value: 'test1' },
        task2: { state: 'fulfilled', value: 'test2' },
        task3: { state: 'fulfilled', value: 'test3' }
      });
      assert.deepStrictEqual(order, ['test3', 'test2', 'test1']);
    });
  });

  it('should execute with function tasks', () => {
    const tasks = {
      task1: () => Aigle.delay(DELAY * 3, 'test1'),
      task2: Aigle.delay(DELAY * 2, 'test2'),
      task3: 'test3'
    };
    return Aigle.allSettled(tasks).then(res => {
      assert.deepStrictEqual(res, {
        task1: { state: 'fulfilled', value: 'test1' },
        task2: { state: 'fulfilled', value: 'test2' },
        task3: { state: 'fulfilled', value: 'test3' }
      });
      assert.deepStrictEqual(Object.keys(res), ['task1', 'task2', 'task3']);
    });
  });

  it('should work with a Set instance', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = new Set([delay(1, DELAY * 3), delay(2, DELAY * 2), delay(3, DELAY * 1)]);
    return Aigle.allSettled(tasks).then(res => {
      assert.deepStrictEqual(res, [
        { state: 'fulfilled', value: 1 },
        { state: 'fulfilled', value: 2 },
        { state: 'fulfilled', value: 3 }
      ]);
      assert.deepStrictEqual(order, [3, 2, 1]);
    });
  });

  it('should work with a Map instance', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = new Map([
      ['task1', delay(1, DELAY * 3)],
      ['task2', delay(2, DELAY * 2)],
      ['task3', delay(3, DELAY * 1)]
    ]);
    return Aigle.allSettled(tasks).then(res => {
      assert.ok(res instanceof Map);
      assert.deepStrictEqual(res.get('task1'), { state: 'fulfilled', value: 1 });
      assert.deepStrictEqual(res.get('task2'), { state: 'fulfilled', value: 2 });
      assert.deepStrictEqual(res.get('task3'), { state: 'fulfilled', value: 3 });
      assert.deepStrictEqual(order, [3, 2, 1]);
    });
  });

  it('should execute with error promises', () => {
    const tasks = [Promise.reject('error1'), Promise.reject('error2'), Promise.reject('error3')];
    return Aigle.allSettled(tasks).then(res => {
      assert.deepStrictEqual(res, [
        { state: 'rejected', reason: 'error1' },
        { state: 'rejected', reason: 'error2' },
        { state: 'rejected', reason: 'error3' }
      ]);
    });
  });

  it('should execute with Aigle instances', () => {
    const tasks = [Aigle.reject('error1'), Aigle.reject('error2'), Aigle.reject('error3')];
    return Aigle.allSettled(tasks).then(res => {
      assert.deepStrictEqual(res, [
        { state: 'rejected', reason: 'error1' },
        { state: 'rejected', reason: 'error2' },
        { state: 'rejected', reason: 'error3' }
      ]);
    });
  });

  it('should return an empty array immediately', () => {
    return Aigle.allSettled([]).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.deepStrictEqual(res, []);
    });
  });

  it('should return an empty object immediately', () => {
    return Aigle.allSettled({}).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
      assert.deepStrictEqual(res, {});
    });
  });

  it('should return an empty object immediately', () => {
    return Aigle.allSettled().then(res => {
      assert.deepStrictEqual(res, {});
    });
  });
});

parallel('#allSettled', () => {
  it('should execute in parallel', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [delay('test1', DELAY * 3), delay('test2', DELAY * 2), delay('test3', DELAY * 1)];
    return Aigle.resolve(tasks)
      .allSettled()
      .then(res => {
        assert.deepStrictEqual(res, [
          { state: 'fulfilled', value: 'test1' },
          { state: 'fulfilled', value: 'test2' },
          { state: 'fulfilled', value: 'test3' }
        ]);
        assert.deepStrictEqual(order, ['test3', 'test2', 'test1']);
      });
  });

  it('should execute with object tasks in parallel', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', DELAY * 3),
      task2: delay('test2', DELAY * 2),
      task3: delay('test3', DELAY * 1)
    };
    return Aigle.resolve(tasks)
      .allSettled()
      .then(res => {
        assert.deepStrictEqual(res, {
          task1: { state: 'fulfilled', value: 'test1' },
          task2: { state: 'fulfilled', value: 'test2' },
          task3: { state: 'fulfilled', value: 'test3' }
        });
        assert.deepStrictEqual(order, ['test3', 'test2', 'test1']);
      });
  });

  it('should execute with error promises', () => {
    const tasks = [Promise.reject('error1'), Promise.reject('error2'), Promise.reject('error3')];
    return Aigle.resolve(tasks)
      .allSettled()
      .then(res => {
        assert.deepStrictEqual(res, [
          { state: 'rejected', reason: 'error1' },
          { state: 'rejected', reason: 'error2' },
          { state: 'rejected', reason: 'error3' }
        ]);
      });
  });

  it('should execute with Aigle instances', () => {
    const tasks = [Aigle.reject('error1'), Aigle.reject('error2'), Aigle.reject('error3')];
    return Aigle.resolve(tasks)
      .allSettled()
      .then(res => {
        assert.deepStrictEqual(res, [
          { state: 'rejected', reason: 'error1' },
          { state: 'rejected', reason: 'error2' },
          { state: 'rejected', reason: 'error3' }
        ]);
      });
  });
});
