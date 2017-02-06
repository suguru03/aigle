'use strict';

module.exports = ({ Aigle, Bluebird }) => {

  return {
    'promisify:simple': {
      doc: true,
      setup: () => {
        this.func = callback => setImmediate(callback);
      },
      aigle: () => {
        return Aigle.promisify(this.func)();
      },
      bluebird: () => {
        return Bluebird.promisify(this.func)();
      }
    },
    'promisify:multiple': {
      doc: true,
      setup: () => {
        this.func = (a, b, c, callback) => setImmediate(callback);
      },
      aigle: () => {
        return Aigle.promisify(this.func)(1, 2, 3);
      },
      bluebird: () => {
        return Bluebird.promisify(this.func)(1, 2, 3);
      }
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
