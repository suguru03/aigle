'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird }) => {

  let count;

  return {
    'race': {
      doc: true,
      setup: config => count = config.count,
      aigle: () => {
        const tasks = _.times(count, () => {
          return new Aigle(resolve => process.nextTick(resolve));
        });
        return Aigle.race(tasks);
      },
      bluebird: () => {
        const tasks = _.times(count, () => {
          return new Bluebird(resolve => process.nextTick(resolve));
        });
        return Bluebird.race(tasks);
      }
    },
    'race:sync': {
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
    }
  };
};
