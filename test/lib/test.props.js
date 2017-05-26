'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('props', () => {

  it('should execute in parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', DELAY * 3),
      task2: delay('test2', DELAY * 2),
      task3: delay('test3', DELAY * 1)
    };
    return Aigle.props(tasks)
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

  it('should catch an error', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', new Error('error1'), DELAY * 3),
      task2: delay('test2', new Error('error2'), DELAY * 2),
      task3: delay('test3', null, DELAY * 1)
    };
    return Aigle.props(tasks)
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

  it('should execute with instances of Aigle promise', () => {

    const tasks = {
      task1: new Aigle(resolve => resolve(1)),
      task2: new Aigle(resolve => setTimeout(() => resolve(2), 20)),
      task3: new Aigle(resolve => setTimeout(() => resolve(3), 10))
    };
    return Aigle.props(tasks)
      .then(res => assert.deepEqual(res, {
        task1: 1,
        task2: 2,
        task3: 3
      }));
  });

  it('should execute with not promise instance', () => {

    const tasks = {
      task1: new Aigle(resolve => resolve(1)),
      task2: 2,
      task3: 3
    };
    return Aigle.props(tasks)
      .then(res => assert.deepEqual(res, {
        task1: 1,
        task2: 2,
        task3: 3
      }));
  });

  it('should return immediately', () => {

    return Aigle.props({})
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Object]');
        assert.deepEqual(res, {});
      });
  });

  it('should throw an error', () => {

    return Aigle.props({
      e1: Aigle.reject(new TypeError('error1')),
      e2: Aigle.reject(new TypeError('error2'))
    })
    .then(() => assert(false))
    .catch(TypeError, error => assert.ok(error));
  });
});

parallel('#props', () => {

  it('should execute in parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', DELAY * 3),
      task2: delay('test2', DELAY * 2),
      task3: delay('test3', DELAY * 1)
    };
    return Aigle.resolve(tasks)
      .props()
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

  it('should catch an error', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', new Error('error1'), DELAY * 3),
      task2: delay('test2', new Error('error2'), DELAY * 2),
      task3: delay('test3', null, DELAY * 1)
    };
    return Aigle.resolve(tasks)
      .props()
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

  it('should throw an error with a reject promise', done => {

    process.on('unhandledRejection', done);
    const error = new Error('error');
    const promise = Aigle.reject(error);
    promise.catch(error => assert(error));
    const tasks = {
      a: promise,
      b: promise,
      c: promise
    };
    return Aigle.delay(DELAY, tasks)
      .props()
      .then(() => assert(false))
      .catch(err => {
        assert.strictEqual(err, error);
        done();
      });
  });
});
