'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Promise = require('../../');
const DELAY = require('../config').DELAY;

parallel('eachLimit', () => {

  it('should execute', () => {

    const order = [];
    const tasks = [1, 4, 2, 1];
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.eachLimit(tasks, 2, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4],
          [3, 1]
        ]);
      });
  });

  it('should execute with object tasks', () => {
    const order = [];
    const tasks = {
      task1: 1,
      task2: 4,
      task3: 2,
      task4: 1
    };
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.eachLimit(tasks, 2, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4],
          ['task4', 1]
        ]);
      });
  });

});

parallel('#each', () => {

  it('should execute', () => {

    const order = [];
    const tasks = [1, 4, 2, 1];
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.resolve(tasks)
      .eachLimit(2, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4],
          [3, 1]
        ]);
      });
  });

  it('should execute with object tasks', () => {
    const order = [];
    const tasks = {
      task1: 1,
      task2: 4,
      task3: 2,
      task4: 1
    };
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.resolve(tasks)
      .eachLimit(2, iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          ['task1', 1],
          ['task3', 2],
          ['task2', 4],
          ['task4', 1]
        ]);
      });
  });

  it('should execute with concurrency', () => {

    const order = [];
    const tasks = [1, 4, 2, 1];
    const iterator = (value, key) => {
      return new Promise(resolve => setTimeout(() => {
        order.push([key, value]);
        return resolve(value);
      }, DELAY * value));
    };
    return Promise.resolve(tasks)
      .concurrency(2)
      .eachLimit(iterator)
      .then(res => {
        assert.deepEqual(res, undefined);
        assert.deepEqual(order, [
          [0, 1],
          [2, 2],
          [1, 4],
          [3, 1]
        ]);
      });
  });

});
