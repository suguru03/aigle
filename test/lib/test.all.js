'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');
const Aigle = require('../../');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('all', () => {

  it('should execute on parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Aigle.all(tasks)
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
    return Aigle.all(tasks)
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

  it('should execute on native promise', () => {

    const limit = 5;
    const order = [];
    const tasks = _.times(limit, n => {
      return new Aigle(resolve => {
        setTimeout(() => {
          order.push(n);
          resolve(n);
        }, DELAY * (limit - n));
      });
    });
    return global.Promise.all(tasks)
      .then(res => {
        assert.deepEqual(res, [0, 1, 2, 3, 4]);
        assert.deepEqual(order, [4, 3, 2, 1, 0]);
      });
  });

  it('should execute with instances of Aigle promise', () => {

    const tasks = [
      new Aigle(resolve => resolve(1)),
      new Aigle(resolve => setTimeout(() => resolve(2), 20)),
      new Aigle(resolve => setTimeout(() => resolve(3), 10)) ]; return Aigle.all(tasks) .then(res => assert.deepEqual(res, [1, 2, 3])); });

  it('should execute with not promise instance', () => {

    const tasks = [
      new Aigle(resolve => resolve(1)),
      2,
      3
    ];
    return Aigle.all(tasks)
      .then(res => assert.deepEqual(res, [1, 2, 3]));
  });

  it('should return immediately', () => {

    return Aigle.all([])
      .then(res => assert.deepEqual(res, []));
  });

  it('should throw an error', () => {

    return Aigle.all([
      Aigle.reject(new TypeError('error1')),
      Aigle.reject(new TypeError('error2'))
    ])
    .then(() => assert(false))
    .catch(TypeError, error => assert.ok(error));
  });

  it('should execute with an error promise', done => {

    process.on('unhandledRejection', done);
    const promise = Aigle.reject(1);
    Aigle.all([
      Aigle.reject(1),
      promise
    ])
    .catch(error => {
      assert(error);
      done();
    });
  });
});

parallel('#all', () => {

  it('should execute on parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Aigle.resolve(tasks)
      .all()
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

  it('should execute with multiple receivers on synchronous', () => {

    const array = [1, 2, 3];
    const promise = Aigle.resolve(array);
    return Aigle.all([
      promise.all()
        .then(value => {
          assert.deepEqual(value, array);
          return 4;
        }),
      promise.all()
        .then(value => {
          assert.deepEqual(value, array);
          return 5;
        }),
      promise.all()
        .then(value => {
          assert.deepEqual(value, array);
          return 6;
        })
    ])
    .then(value => assert.deepEqual(value, [4, 5, 6]));
  });

  it('should execute with multiple receivers on asynchronous', () => {

    const array = [1, 2, 3];
    const promise = new Aigle(resolve => setImmediate(() => resolve(array)));
    return Aigle.all([
      promise.all()
        .then(value => {
          assert.deepEqual(value, array);
          return 4;
        }),
      promise.all()
        .then(value => {
          assert.deepEqual(value, array);
          return 5;
        }),
      promise.all()
        .then(value => {
          assert.deepEqual(value, array);
          return 6;
        })
    ])
    .then(value => assert.deepEqual(value, [4, 5, 6]));
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
      .all()
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
    const tasks = [promise, promise, promise];
    return Aigle.delay(DELAY, tasks)
      .all()
      .then(() => assert(false))
      .catch(err => {
        assert.strictEqual(err, error);
        done();
      });
  });
});
