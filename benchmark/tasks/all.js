'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird }) => {

  let count;

  return {
    config: {
      count: 100,
      times: 10000
    },
    'promise:all': {
      setup: config => {
        count = config.count;
        this.atasks = _.times(count, n => {
          return new Aigle(resolve => resolve(n));
        });
        this.btasks = _.times(count, n => {
          return new Bluebird(resolve => resolve(n));
        });
      },
      aigle: () => Aigle.all(this.atasks),
      bluebird: () => Bluebird.all(this.btasks)
    },
    'promise:all:async': {
      setup: config => {
        count = config.count;
        this.atasks = _.times(count, () => {
          return new Aigle(resolve => setImmediate(resolve));
        });
        this.btasks = _.times(count, () => {
          return new Bluebird(resolve => setImmediate(resolve));
        });
      },
      aigle: () => Aigle.all(this.atasks),
      bluebird: () => Bluebird.all(this.btasks)
    }
  };
};
