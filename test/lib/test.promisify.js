'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('promisify', () => {

  it('should execute', () => {
    const fn = callback => {
      setTimeout(() => callback(null, 1), 10);
    };
    return Aigle.promisify(fn)()
      .then(res => assert.strictEqual(res, 1));
  });

  it('should execute with an argument', () => {
    const fn = (a, callback) => {
      assert.strictEqual(a, 1);
      setTimeout(() => callback(null, a + 1), 10);
    };
    return Aigle.promisify(fn)(1)
      .then(res => assert.strictEqual(res, 2));
  });

  it('should execute with two arguments', () => {
    const fn = (a, b, callback) => {
      assert.strictEqual(a, 1);
      assert.strictEqual(b, 2);
      setTimeout(() => callback(null, a + b + 1), 10);
    };
    return Aigle.promisify(fn)(1, 2)
      .then(res => assert.strictEqual(res, 4));
  });

  it('should execute with five arguments', () => {
    const fn = (a, b, c, d, e, callback) => {
      assert.strictEqual(a, 1);
      assert.strictEqual(b, 2);
      assert.strictEqual(c, 3);
      assert.strictEqual(d, 4);
      assert.strictEqual(e, 5);
      callback(null, a + b + c + d + e + 1);
    };
    return Aigle.promisify(fn)(1, 2, 3, 4, 5)
      .then(res => assert.strictEqual(res, 16));
  });

  it('should execute with non-argument', () => {
    const fn = (callback, arg) => {
      assert.strictEqual(arg, undefined);
      callback(null, 1);
    };
    return Aigle.promisify(fn)()
      .then(res => assert.strictEqual(res, 1));
  });

  it('should call again', done => {
    let callCount = 0;
    const fn = callback => {
      callCount++;
      callback(null, callCount);
    };
    const promisefied = Aigle.promisify(fn);
    const first = promisefied();
    const second = promisefied();
    first.then(res => assert.strictEqual(res, 1));
    second.then(res => assert.strictEqual(res, 2));
    first.then(res => assert.strictEqual(res, 1));
    second.then(res => assert.strictEqual(res, 2));
    assert.strictEqual(callCount, 2);
    setTimeout(done, DELAY);
  });

  it('should bind oneself with string argument', () => {
    const obj = {
      fn: function(arg, callback) {
        assert.strictEqual(this, obj);
        assert.strictEqual(arg, 1);
        callback(null, 2);
      }
    };
    const promisefied = Aigle.promisify(obj, 'fn');
    return promisefied(1)
      .then(res => {
        assert.strictEqual(res, 2);
      });
  });

  it('should bind context', () => {
    const ctx = {};
    const obj = {
      fn: function(arg, callback) {
        assert.strictEqual(this, ctx);
        assert.strictEqual(arg, 1);
        callback(null, 2);
      }
    };
    const promisefied = Aigle.promisify(obj.fn, { context: ctx });
    return promisefied(1)
      .then(res => {
        assert.strictEqual(res, 2);
      });
  });

});
