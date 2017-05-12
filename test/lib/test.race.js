'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('race', () => {

  it('should execute', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Aigle.race(tasks)
      .then(res => {
        assert.strictEqual(res, 'test3');
        assert.deepEqual(order, ['test3']);
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
    return Aigle.race(tasks)
      .then(res => {
        assert.strictEqual(res, 'test3');
        assert.deepEqual(order, ['test3']);
      });
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
        assert.deepEqual(order, ['test3']);
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
        assert.deepEqual(order, ['test3']);
      });
  });

  it('should return undefined if tasks is an empty array', () => {

    return Aigle.race([])
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if tasks is an empty object', () => {

    return Aigle.race({})
      .then(res => assert.strictEqual(res, undefined));
  });

  it('should return undefined if tasks is empty', () => {

    return Aigle.race()
      .then(res => assert.strictEqual(res, undefined));
  });
});


parallel('#race', () => {

  it('should execute', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Aigle.resolve(tasks)
      .race()
      .then(res => {
        assert.strictEqual(res, 'test3');
        assert.deepEqual(order, ['test3']);
      });
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
        assert.deepEqual(order, ['test3']);
      });
  });

  it('should return first object if previous promise is already resolved', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    const promise = Aigle.resolve(tasks);
    return Aigle.delay(DELAY * 4)
      .then(() => promise.race())
      .then(value => assert.strictEqual(value, 'test1'));
  });
});
