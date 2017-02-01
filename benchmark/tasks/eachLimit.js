'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {

  return {
    'eachLimit:array': {
      setup: config => {
        this.limit = 8;
        this.array = _.times(config.count);
        this.aigleIterator = () => {};
        this.neoAsyncIterator = (n, cb) => cb();
      },
      aigle: () => {
        return Aigle.eachLimit(this.array, this.limit, this.aigleIterator);
      },
      neoAsync: callback => {
        neoAsync.eachLimit(this.array, this.limit, this.neoAsyncIterator, callback);
      }
    },
    'eachLimit:array:async': {
      setup: config => {
        this.limit = 8;
        this.array = _.times(config.count);
        this.aigleIterator = () => new Aigle(resolve => setImmediate(resolve));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb);
      },
      aigle: () => {
        return Aigle.eachLimit(this.array, this.limit, this.aigleIterator);
      },
      neoAsync: callback => {
        neoAsync.eachLimit(this.array, this.limit, this.neoAsyncIterator, callback);
      }
    }
  };
};
