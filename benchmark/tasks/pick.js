'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {

  return {
    'pick:array': {
      setup: config => {
        this.array = _.times(config.count);
        this.promiseIterator = value => value % 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n % 2);
      },
      aigle: () => {
        return Aigle.pick(this.array, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.pick(this.array, this.neoAsyncIterator, callback);
      }
    },
    'pick:array:async': {
      setup: config => {
        this.array = _.times(config.count);
        this.aigleIterator = value => new Aigle(resolve => process.nextTick(resolve, value % 2));
        this.neoAsyncIterator = (n, cb) => process.nextTick(cb, null, n % 2);
      },
      aigle: () => {
        return Aigle.pick(this.array, this.aigleIterator);
      },
      neoAsync: callback => {
        neoAsync.pick(this.array, this.neoAsyncIterator, callback);
      }
    }
  };
};
