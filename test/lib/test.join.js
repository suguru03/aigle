'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Promise = require('../../');
const util = require('../util');
const DELAY = require('../config').DELAY;

parallel('join', () => {

  it('should execute on parallel', () => {

    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [
      delay(1, DELAY * 3),
      delay(2, DELAY * 2),
      delay(3, DELAY * 1)
    ];
    const fn = (arg1, arg2, arg3) => {
      return arg1 + arg2 + arg3;
    };
    return Promise.join(tasks[0], tasks[1], tasks[2], fn)
      .then(res => {
        assert.strictEqual(res, 6);
      });
  });
});
