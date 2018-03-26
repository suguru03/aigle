'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('times', () => {
  it('should execute', () => {
    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 ? (n + 5) * DELAY : (n + 1) * DELAY;
      return new Aigle(resolve => {
        setTimeout(() => {
          order.push(n);
          resolve(n * 2);
        }, delay);
      });
    };
    return Aigle.times(count, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, count);
      assert.deepStrictEqual(res, [0, 2, 4, 6, 8]);
      assert.deepStrictEqual(order, [0, 2, 4, 1, 3]);
    });
  });

  it('should execute with synchronous function', () => {
    const count = 5;
    const iterator = n => n * 2;
    return Aigle.times(count, iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, count);
      assert.deepStrictEqual(res, [0, 2, 4, 6, 8]);
    });
  });

  it('should return an empty array if times is not number', () => {
    const iterator = n => n * 2;
    return Aigle.times('test', iterator).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 0);
    });
  });

  it('should return an array even if iterator is undefined', () => {
    return Aigle.times(5).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 5);
      assert.deepStrictEqual(res, [0, 1, 2, 3, 4]);
    });
  });

  it('should execute with decimal number', () => {
    return Aigle.times(5.5).then(res => {
      assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
      assert.strictEqual(res.length, 5);
      assert.deepStrictEqual(res, [0, 1, 2, 3, 4]);
    });
  });

  it('should catch a TypeError', () => {
    const iterator = n => n();
    return Aigle.times(10, iterator)
      .then(assert.fail)
      .catch(TypeError, assert.ok);
  });
});

parallel('#times', () => {
  it('should execute', () => {
    const count = 5;
    const order = [];
    const iterator = n => {
      const delay = n % 2 ? (n + 5) * DELAY : (n + 1) * DELAY;
      return new Aigle(resolve => {
        setTimeout(() => {
          order.push(n);
          resolve(n * 2);
        }, delay);
      });
    };
    return Aigle.resolve(count)
      .times(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepStrictEqual(res, [0, 2, 4, 6, 8]);
        assert.deepStrictEqual(order, [0, 2, 4, 1, 3]);
      });
  });

  it('should execute with delay', () => {
    const count = 5;
    const iterator = n => n * 2;
    return Aigle.delay(DELAY, count)
      .times(iterator)
      .then(res => {
        assert.strictEqual(Object.prototype.toString.call(res), '[object Array]');
        assert.strictEqual(res.length, count);
        assert.deepStrictEqual(res, [0, 2, 4, 6, 8]);
      });
  });
});
