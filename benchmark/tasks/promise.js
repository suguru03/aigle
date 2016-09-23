'use strict';

const _ = require('lodash');

let count = 0;

module.exports = funcs => {

  const Aigle = funcs.Aigle;
  const Bluebird = funcs.Bluebird;

  return {
    config: {
      count: 100,
      times: 100000
    },
    'promise:new': {
      aigle: () => {
        return new Aigle(resolve => resolve(0));
      },
      bluebird: () => {
        return new Bluebird(resolve => resolve(0));
      }
    },
    'promise:then': {
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        let p = new Aigle(resolve => resolve(0));
        _.times(count, () => {
          p = p.then(value => ++value);
        });
        return p;
      },
      bluebird: () => {
        let p = new Bluebird(resolve => resolve(0));
        _.times(count, () => {
          p = p.then(value => ++value);
        });
        return p;
      }
    }
  };
};
