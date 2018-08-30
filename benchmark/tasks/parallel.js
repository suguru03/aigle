'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {
  let count;

  return {
    parallel: {
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        const tasks = _.times(count, n => () => new Aigle(resolve => setImmediate(resolve, n)));
        return Aigle.parallel(tasks);
      },
      neoAsync: callback => {
        const tasks = _.times(count, n => done => done(null, n));
        return neoAsync.parallel(tasks, callback);
      }
    }
  };
};
