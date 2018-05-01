'use strict';

const util = require('util');
const path = require('path');
const assert = require('assert');
const { exec } = require('child_process');

const _ = require('lodash');
const parallel = require('mocha.parallel');

const [major] = process.versions.node.split('.').map(Number);
const custom = major >= 8 && util.promisify.custom;

const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('promisify', () => {
  const dirpath = path.resolve(__dirname, '../../lib');
  const aiglepath = path.resolve(dirpath, 'aigle.js');
  beforeEach(() => {
    const re = new RegExp(dirpath);
    delete require.cache[aiglepath];
    _.forOwn(require.cache, (cache, filepath) => {
      if (re.test(filepath)) {
        delete require.cache[filepath];
      }
    });
  });

  it('should execute', () => {
    const fn = callback => {
      setTimeout(() => callback(null, 1), 10);
    };
    return Aigle.promisify(fn)().then(res => assert.strictEqual(res, 1));
  });

  it('should execute with an argument', () => {
    const fn = (a, callback) => {
      assert.strictEqual(a, 1);
      setTimeout(() => callback(null, a + 1), 10);
    };
    return Aigle.promisify(fn)(1).then(res => assert.strictEqual(res, 2));
  });

  it('should execute with two arguments', () => {
    const fn = (a, b, callback) => {
      assert.strictEqual(a, 1);
      assert.strictEqual(b, 2);
      setTimeout(() => callback(null, a + b + 1), 10);
    };
    return Aigle.promisify(fn)(1, 2).then(res => assert.strictEqual(res, 4));
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
    return Aigle.promisify(fn)(1, 2, 3, 4, 5).then(res => assert.strictEqual(res, 16));
  });

  it('should execute with non-argument', () => {
    const fn = (callback, arg) => {
      assert.strictEqual(arg, undefined);
      callback(null, 1);
    };
    return Aigle.promisify(fn)().then(res => assert.strictEqual(res, 1));
  });

  it('should call again', done => {
    let callCount = 0;
    const fn = callback => {
      callCount++;
      callback(null, callCount);
    };
    const promisified = Aigle.promisify(fn);
    const first = promisified();
    const second = promisified();
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
    const promisified = Aigle.promisify(obj, 'fn');
    return promisified(1).then(res => {
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
    const promisified = Aigle.promisify(obj.fn, { context: ctx });
    return promisified(1).then(res => {
      assert.strictEqual(res, 2);
    });
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
    const obj = { fn };
    return Aigle.promisify(obj, 'fn')(1, 2, 3, 4, 5).then(res => assert.strictEqual(res, 16));
  });

  it('should throw an error if second argument is boolean', () => {
    let error;
    const obj = {
      fn: callback => callback()
    };
    try {
      Aigle.promisify(obj, true);
    } catch (e) {
      error = e;
    }
    assert.ok(error);
  });

  it('should throw an error if first argument is invalid', () => {
    let error;
    try {
      Aigle.promisify('test');
    } catch (e) {
      error = e;
    }
    assert.ok(error);
  });

  it('should throw an error if error is caused', () => {
    const error = new TypeError('error');
    const obj = {
      test: callback => callback(error)
    };
    return Aigle.promisify(obj, 'test')()
      .then(() => assert(false))
      .catch(TypeError, err => assert.strictEqual(err, error));
  });

  it('should not cause error even if the function is already promisified', () => {
    const obj = {
      fn: function(arg, callback) {
        assert.strictEqual(this, obj);
        assert.strictEqual(arg, 1);
        callback(null, 2);
      }
    };
    const promisified = Aigle.promisify(obj, 'fn');
    Aigle.promisify(promisified);
    const key = 'test';
    obj[key] = promisified;
    Aigle.promisify(obj, key);
    return obj[key](1).then(value => assert.strictEqual(value, 2));
  });

  it('should work setTimeout the same functionality as util.promisify', () => {
    const setTimeoutPromise = Aigle.promisify(setTimeout);
    const str = 'foobar';
    assert.notStrictEqual(setTimeoutPromise, setTimeout[custom]);
    const promise = setTimeoutPromise(DELAY, str).then(value => assert.strictEqual(value, str));
    assert.ok(promise instanceof Aigle);
    return promise;
  });

  it('should work setImmediate the same functionality as util.promisify', () => {
    const setImmediatePromise = Aigle.promisify(setImmediate);
    const str = 'foobar';
    assert.notStrictEqual(setImmediatePromise, setImmediate[custom]);
    const promise = setImmediatePromise(str).then(value => assert.strictEqual(value, str));
    assert.ok(promise instanceof Aigle);
    return promise;
  });

  it('should get the native promisified exec', () => {
    const promisified = Aigle.promisify(exec);
    assert.ok(promisified);
    assert.notStrictEqual(promisified, exec[custom]);
  });

  it('should return aigle promisified native function', () => {
    const setImmediatePromise = Aigle.promisify(setImmediate);
    return setImmediatePromise()
      .then(() => setImmediatePromise([1, 2, 3]))
      .map(v => v * 2)
      .then(arr => assert.deepStrictEqual(arr, [2, 4, 6]));
  });

  it('should work with setImmediate even if util promisify does not exist', () => {
    util.promisify = null;
    const Aigle = require(aiglepath);
    const setImmediatePromise = Aigle.promisify(setImmediate);
    assert.notStrictEqual(setImmediatePromise, setImmediate[custom]);
    const str = 'foobar';
    const promise = setImmediatePromise(str).then(value => assert.strictEqual(value, str));
    assert.ok(promise instanceof Aigle);
    return promise;
  });

  it('should work with setImmediate even if util promisify does not exist', () => {
    util.promisify = null;
    const Aigle = require(aiglepath);
    const setTimeoutPromise = Aigle.promisify(setTimeout);
    assert.notStrictEqual(setTimeoutPromise, setTimeout[custom]);
    const str = 'foobar';
    return setTimeoutPromise(DELAY, str).then(value => assert.strictEqual(value, str));
  });
});
