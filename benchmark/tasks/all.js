'use strict';

const _ = require('lodash');

module.exports = funcs => {

  const Aigle = funcs.Aigle;
  const Bluebird = funcs.Bluebird;

  let count;

  return {
    config: {
      count: 100,
      times: 10000
    },
    'promise:then': {
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
    }
  };
};
