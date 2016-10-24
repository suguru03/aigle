'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird }) => {

  let count;

  return {
    config: {
      count: 100,
      times: 100000
    },
    'promise:all': {
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        const tasks = _.times(count, n => {
          return new Aigle(resolve => resolve(n));
        });
        return Aigle.all(tasks);
      },
      bluebird: () => {
        const tasks = _.times(count, n => {
          return new Bluebird(resolve => resolve(n));
        });
        return Bluebird.all(tasks);
      }
    },
    'promise:all:async': {
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        const tasks = _.times(count, () => {
          return new Aigle(resolve => setImmediate(resolve));
        });
        return Aigle.all(tasks);
      },
      bluebird: () => {
        const tasks = _.times(count, () => {
          return new Bluebird(resolve => setImmediate(resolve));
        });
        return Bluebird.all(tasks);
      }
    }
  };
};
