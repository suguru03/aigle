'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Promise = require('../../');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('#Promise#race', () => {

  it('should execute', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Promise.race(tasks)
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
    return Promise.race(tasks)
      .then(() => assert(false))
      .catch(err => {
        assert.ok(err);
        assert.strictEqual(err.message, 'error3');
        assert.deepEqual(order, ['test3']);
      });
  });

});


parallel('#Promise.prototype.race', () => {

  it('should execute', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Promise.resolve(tasks)
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
    return Promise.resolve(tasks)
      .race()
      .then(() => assert(false))
      .catch(err => {
        assert.ok(err);
        assert.strictEqual(err.message, 'error3');
        assert.deepEqual(order, ['test3']);
      });
  });

});
