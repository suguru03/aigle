'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');

parallel('promisifyAll', () => {

  it('should extend an instance', () => {
    class Test {
      constructor() {
        this._value = undefined;
      }
      set(value, callback) {
        setImmediate(() => {
          this._value = value;
          callback();
        });
      }
      get(callback) {
        setImmediate(() => callback(null, this._value));
      }
    }
    const test = new Test();
    test.put = () => {};
    Aigle.promisifyAll(test);
    assert.ok(test.setAsync);
    assert.ok(test.getAsync);
    assert.ok(test.putAsync);
  });

  it('should extend redis sample', () => {
    const test = 'test';
    function RedisClient() {}
    RedisClient.prototype.get = function(key, callback) {
      callback(null, `${key}_${test}`);
    };
    RedisClient.test = function() {};
    const redis = {
      RedisClient: RedisClient,
      test: function() {}
    };
    Aigle.promisifyAll(redis);
    assert.strictEqual(typeof redis.RedisClient.prototype.getAsync, 'function');
    assert.strictEqual(typeof redis.RedisClient.testAsync, 'function');
    const client = new RedisClient();
    const key = 'key';
    return client.getAsync(key)
      .then(value => assert.strictEqual(value, `${key}_${test}`));
  });

});
