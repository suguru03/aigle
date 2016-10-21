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
    'all': {
      setup: config => {
        count = config.count;
        this.atasks = _.times(count, n => {
          return new Aigle(resolve => resolve(n));
        });
        this.btasks = _.times(count, n => {
          return new Bluebird(resolve => resolve(n));
        });
      },
      aigle: () => {
        return Aigle.all(this.atasks);
      },
      bluebird: () => {
        return Bluebird.all(this.btasks);
      }
    }
  };
};
