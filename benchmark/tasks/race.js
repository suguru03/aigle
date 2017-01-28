'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird }) => {

  let count;

  return {
    'promise:race': {
      setup: config => count = config.count,
      aigle: () => {
        const tasks = _.times(count, n => {
          return new Aigle(resolve => resolve(n));
        });
        return Aigle.race(tasks);
      },
      bluebird: () => {
        const tasks = _.times(count, n => {
          return new Bluebird(resolve => resolve(n));
        });
        return Bluebird.race(tasks);
      }
    },
    'promise:race:async': {
      setup: config => count = config.count,
      aigle: () => {
        const tasks = _.times(count, () => {
          return new Aigle(resolve => setImmediate(resolve));
        });
        return Aigle.race(tasks);
      },
      bluebird: () => {
        const tasks = _.times(count, () => {
          return new Bluebird(resolve => setImmediate(resolve));
        });
        return Bluebird.race(tasks);
      }
    }
  };
};
