'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird }) => {

  let count;

  return {
    'all': {
      doc: true,
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        const tasks = _.times(count, n => {
          return new Aigle(resolve => process.nextTick(resolve, n));
        });
        return Aigle.all(tasks);
      },
      bluebird: () => {
        const tasks = _.times(count, n => {
          return new Bluebird(resolve => process.nextTick(resolve, n));
        });
        return Bluebird.all(tasks);
      }
    },
    'all:sync': {
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
    'all:class': {
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        const tasks = _.times(count, n => {
          return new Aigle(resolve => process.nextTick(resolve, n));
        });
        return Aigle.resolve(tasks).all();
      },
      bluebird: () => {
        const tasks = _.times(count, n => {
          return new Bluebird(resolve => process.nextTick(resolve, n));
        });
        return Bluebird.resolve(tasks).all();
      }
    }
  };
};
