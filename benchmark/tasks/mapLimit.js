'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {

  return {
    'mapLimit:array': {
      setup: config => {
        this.limit = 8;
        this.array = _.times(config.count);
        this.promiseIterator = value => value * 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n * 2);
      },
      aigle: () => {
        return Aigle.mapLimit(this.array, this.limit, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.mapLimit(this.array, this.limit, this.neoAsyncIterator, callback);
      }
    },
    'mapLimit:array:async': {
      setup: config => {
        this.limit = 8;
        this.array = _.times(config.count);
        this.promiseIterator = value => new Aigle(resolve => setImmediate(resolve, value * 2));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb, null, n * 2);
      },
      aigle: () => {
        return Aigle.mapLimit(this.array, this.limit, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.mapLimit(this.array, this.limit, this.neoAsyncIterator, callback);
      }
    }
  };
};
