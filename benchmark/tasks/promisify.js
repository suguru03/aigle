'use strict';

const util = require('util');

module.exports = ({ Aigle, Bluebird }) => {

  return {
    'promisify': {
      doc: true,
      setup: () => {
        this.func = callback => setImmediate(callback);
      },
      aigle: () => Aigle.promisify(this.func)(),
      bluebird: () => Bluebird.promisify(this.func)(),
      'native': () => util.promisify(this.func)()
    },
    'promisify:promisified': {
      doc: true,
      setup: () => {
        const func = callback => setImmediate(callback);
        this.aiglePromisifed = Aigle.promisify(func);
        this.bluebirdPromisifed = Bluebird.promisify(func);
        this.nativePromisified = util.promisify(func);
      },
      aigle: () => this.aiglePromisifed(),
      bluebird: () => this.bluebirdPromisifed(),
      'native': () => this.nativePromisified()
    },
    'promisify:multiple': {
      setup: () => {
        this.func = (a, b, c, callback) => setImmediate(callback);
      },
      aigle: () => Aigle.promisify(this.func)(1, 2, 3),
      bluebird: () => Bluebird.promisify(this.func)(1, 2, 3)
    },
    'promisifyAll': {
      doc: true,
      setup: () => {
        this.makeRedis = () => {
          class RedisClient {
            constructor() {}
            get(key, callback) {
              callback(null, key);
            }
          }
          return { RedisClient };
        };
      },
      aigle: () => {
        const suffix = 'Aigle';
        const redis = this.makeRedis();
        Aigle.promisifyAll(redis, { suffix });
        return new redis.RedisClient().getAigle('test');
      },
      bluebird: () => {
        const suffix = 'Bluebird';
        const redis = this.makeRedis();
        Bluebird.promisifyAll(redis, { suffix });
        return new redis.RedisClient().getBluebird('test');
      }
    }
  };
};
