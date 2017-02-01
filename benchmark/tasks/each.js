'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {

  return {
    'each:array': {
      setup: config => {
        this.array = _.times(config.count);
        this.aigleIterator = () => {};
        this.neoAsyncIterator = (n, cb) => cb();
      },
      aigle: () => {
        return Aigle.each(this.array, this.aigleIterator);
      },
      neoAsync: callback => {
        neoAsync.each(this.array, this.neoAsyncIterator, callback);
      }
    },
    'each:array:async': {
      setup: config => {
        this.array = _.times(config.count);
        this.aigleIterator = () => new Aigle(resolve => setImmediate(resolve));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb);
      },
      aigle: () => {
        return Aigle.each(this.array, this.aigleIterator);
      },
      neoAsync: callback => {
        neoAsync.each(this.array, this.neoAsyncIterator, callback);
      }
    }
  };
};
