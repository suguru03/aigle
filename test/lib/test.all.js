'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
// const Promise = require('bluebird');
const Promise = require('../../');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('#all', () => {

  it('should execute on parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Promise.all(tasks)
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
    return Promise.all(tasks)
      .then(() => {
        assert(false);
      })
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

