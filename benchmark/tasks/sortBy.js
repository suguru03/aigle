'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {

  return {
    'sortBy:array': {
      setup: config => {
        this.array = _.shuffle(_.times(config.count));
        this.aigleIterator = n => n;
        this.neoAsyncIterator = (n, cb) => cb(null, n);
      },
      aigle: () => {
        return Aigle.sortBy(this.array, this.aigleIterator);
      },
      neoAsync: callback => {
        neoAsync.sortBy(this.array, this.neoAsyncIterator, callback);
      }
    },
    'sortBy:array:async': {
      setup: config => {
        this.array = _.shuffle(_.times(config.count));
        this.aigleIterator = n => new Aigle(resolve => setImmediate(resolve, n));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb, null, n);
      },
      aigle: () => {
        return Aigle.sortBy(this.array, this.aigleIterator);
      },
      neoAsync: callback => {
        neoAsync.sortBy(this.array, this.neoAsyncIterator, callback);
      }
    }
  };
};
