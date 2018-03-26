'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const util = require('../util');
const { DELAY } = require('../config');

parallel('join', () => {
  it('should execute on parallel', () => {
    const order = [];
    const delay = util.makeDelayTask(order);
    const tasks = [delay(1, DELAY * 3), delay(2, DELAY * 2), delay(3, DELAY * 1)];
    const fn = (arg1, arg2, arg3) => arg1 + arg2 + arg3;
    return Aigle.join(tasks[0], tasks[1], tasks[2], fn).then(res => {
      assert.strictEqual(res, 6);
      assert.deepStrictEqual(order, [3, 2, 1]);
    });
  });

  it('should work by non promise tasks', () => {
    const tasks = [2, 3, 1];
    const fn = (arg1, arg2, arg3) => arg1 + arg2 + arg3;
    return Aigle.join(tasks[0], tasks[1], tasks[2], fn).then(res => assert.strictEqual(res, 6));
  });

  it('should ignore if last argument is not function', () => {
    const tasks = [2, 3, 1];
    return Aigle.join(tasks[0], tasks[1], tasks[2]).then(res => assert.deepStrictEqual(res, [2, 3, 1]));
  });

  it('should throw typeEror', () => {
    const tasks = [2, 3, 1];
    return Aigle.join(tasks[0], tasks[1], tasks[2]).then(res => assert.deepStrictEqual(res, [2, 3, 1]));
  });

  it('should throw TypeError', () => {
    const tasks = [1, 4, 2];
    const fn = value => value.test();
    return Aigle.join(tasks[0], tasks[1], tasks[2], fn)
      .then(() => assert.ok(false))
      .catch(TypeError, error => {
        assert.ok(error);
        assert.ok(error instanceof TypeError);
      });
  });
});

parallel('#spread', () => {
  it('should work', () => {
    const array = [1, 2, 3];
    return Aigle.resolve(array).spread((arg1, arg2, arg3) => {
      assert.strictEqual(arg1, array[0]);
      assert.strictEqual(arg2, array[1]);
      assert.strictEqual(arg3, array[2]);
    });
  });

  it('should work with object', () => {
    const object = {
      task1: 1,
      task2: 4,
      task3: 2
    };
    return Aigle.resolve(object).spread((arg1, arg2, arg3) => {
      assert.strictEqual(arg1, object.task1);
      assert.strictEqual(arg2, object.task2);
      assert.strictEqual(arg3, object.task3);
    });
  });

  it('should work on asynchronous', () => {
    const array = [1, 2, 3];
    return new Aigle(resolve => setImmediate(() => resolve(array))).spread((arg1, arg2, arg3) => {
      assert.strictEqual(arg1, array[0]);
      assert.strictEqual(arg2, array[1]);
      assert.strictEqual(arg3, array[2]);
    });
  });

  it('should execute even if argument length is 0', () => {
    const array = [];
    return Aigle.resolve(array).spread((arg1, arg2, arg3, arg4) => {
      assert.strictEqual(arg1, undefined);
      assert.strictEqual(arg2, undefined);
      assert.strictEqual(arg3, undefined);
      assert.strictEqual(arg4, undefined);
    });
  });

  it('should execute even if argument length is 1', () => {
    const array = [1];
    return Aigle.resolve(array).spread((arg1, arg2, arg3, arg4) => {
      assert.strictEqual(arg1, 1);
      assert.strictEqual(arg2, undefined);
      assert.strictEqual(arg3, undefined);
      assert.strictEqual(arg4, undefined);
    });
  });

  it('should execute even if argument length is 2', () => {
    const array = [1, 2];
    return Aigle.resolve(array).spread((arg1, arg2, arg3, arg4) => {
      assert.strictEqual(arg1, 1);
      assert.strictEqual(arg2, 2);
      assert.strictEqual(arg3, undefined);
      assert.strictEqual(arg4, undefined);
    });
  });

  it('should execute even if argument length is 4', () => {
    const array = [1, 2, 3, 4];
    return Aigle.resolve(array).spread((arg1, arg2, arg3, arg4) => {
      assert.strictEqual(arg1, 1);
      assert.strictEqual(arg2, 2);
      assert.strictEqual(arg3, 3);
      assert.strictEqual(arg4, 4);
    });
  });

  it('should not spread if first argument is a number', () => {
    const num = 10;
    return Aigle.resolve(num).spread(arg1 => assert.strictEqual(arg1, num));
  });

  it('should spread if first argument is a string', () => {
    const str = 'test';
    return Aigle.resolve(str).spread((arg1, arg2, arg3, arg4) => {
      assert.strictEqual(arg1, 't');
      assert.strictEqual(arg2, 'e');
      assert.strictEqual(arg3, 's');
      assert.strictEqual(arg4, 't');
    });
  });

  it('should not cause any errors', () => {
    const array = [1, 2, 3];
    return Aigle.resolve(array)
      .spread()
      .then(value => assert.strictEqual(value, array));
  });

  it('should not execute if error is caused', () => {
    const array = [1, 2, 3];
    const error = new Error('error');
    return Aigle.resolve(array)
      .then(() => Aigle.reject(error))
      .spread(() => assert.ok(false))
      .catch(err => assert.strictEqual(err, error));
  });

  it('should throw TypeError', () => {
    return Aigle.resolve('test')
      .spread(arg1 => arg1())
      .then(() => assert(false))
      .catch(TypeError, error => assert.ok(error));
  });
});
