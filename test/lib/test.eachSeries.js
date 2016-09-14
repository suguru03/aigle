'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Promise = require('../../');
const DELAY = require('../config').DELAY;

parallel('eachSeries', () => {

  it('should execute on series', () => {

    const order = [];
    const tasks = [1, 4, 2];
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.eachSeries(tasks, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });

  it('should execute with object tasks on parallel', () => {
    const order = [];
    const tasks = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.eachSeries(tasks, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4],
          ['task3', 2]
        ]);
      });
  });

});

parallel('#each', () => {

  it('should execute on parallel', () => {

    const order = [];
    const tasks = [1, 4, 2];
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.resolve(tasks)
      .eachSeries(iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [1, 4],
          [2, 2]
        ]);
      });
  });

  it('should execute with object tasks on parallel', () => {
    const order = [];
    const tasks = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.resolve(tasks)
      .eachSeries(iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task2', 4],
          ['task3', 2]
        ]);
      });
  });

});
