'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Promise = require('../../');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('each', () => {

  it('should execute on parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Promise.each(tasks)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
      });
  });

  it('should execute on parallel with object tasks', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', DELAY * 3),
      task2: delay('test2', DELAY * 2),
      task3: delay('test3', DELAY * 1)
    };
    return Promise.each(tasks)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
      });
  });

});

parallel('#each', () => {

  it('should execute on parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay('test1', DELAY * 3),
      delay('test2', DELAY * 2),
      delay('test3', DELAY * 1)
    ];
    return Promise.resolve(tasks)
      .each()
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
      });
  });

  it('should execute on parallel with object tasks', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = {
      task1: delay('test1', DELAY * 3),
      task2: delay('test2', DELAY * 2),
      task3: delay('test3', DELAY * 1)
    };
    return Promise.resolve(tasks)
      .each()
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          'test3',
          'test2',
          'test1'
        ]);
      });
  });

});
