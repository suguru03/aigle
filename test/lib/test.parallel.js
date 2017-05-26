'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('parallel', () => {

  it('should execute in parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Aigle.parallel(tasks)
      .then(res => {
        assert.deepEqual(res, [
          'test1',
          'test2',
          'test3'
        ]);
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
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
    return Aigle.parallel(tasks)
      .then(res => {
        assert.deepEqual(res, {
          task1: 'test1',
          task2: 'test2',
          task3: 'test3'
        });
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
      });
  });

  it('should return an empty array immediately', () => {

    return Aigle.parallel([])
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.deepEqual(res, []);
      });
  });

  it('should return an empty object immediately', () => {

    return Aigle.parallel({})
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should return an empty object immediately', () => {

    return Aigle.parallel()
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });
});


parallel('#parallel', () => {

  it('should execute in parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Aigle.resolve(tasks)
      .parallel()
      .then(res => {
        assert.deepEqual(res, [
          'test1',
          'test2',
          'test3'
        ]);
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
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
      .parallel()
      .then(res => {
        assert.deepEqual(res, {
          task1: 'test1',
          task2: 'test2',
          task3: 'test3'
        });
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
      });
  });

  it('should execute with delay', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Aigle.delay(DELAY, tasks)
      .parallel()
      .then(res => {
        assert.deepEqual(res, [
          'test1',
          'test2',
          'test3'
        ]);
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
      });
  });

  it('should catch an error', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', new Error('error1'), DELAY * 3),
      delay('test2', new Error('error2'), DELAY * 2),
      delay('test3', null, DELAY * 1)
    ];
    return Aigle.resolve(tasks)
      .parallel()
      .then(() => assert(false))
      .catch(err => {
        assert.ok(err);
        assert.strictEqual(err.message, 'error2');
        assert.deepEqual(order, [
          'test3',
          'test2'
        ]);
      });
  });

});
