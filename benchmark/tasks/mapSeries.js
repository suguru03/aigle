'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {

  return {
    'mapSeries:array': {
      setup: config => {
        this.array = _.times(config.count);
        this.promiseIterator = value => value * 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n * 2);
      },
      aigle: () => {
        return Aigle.mapSeries(this.array, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.mapSeries(this.array, this.neoAsyncIterator, callback);
      }
    },
    'mapSeries:array:async': {
      setup: config => {
        this.array = _.times(config.count);
        this.promiseIterator = value => new Aigle(resolve => setImmediate(resolve, value * 2));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb, null, n * 2);
      },
      aigle: () => {
        return Aigle.mapSeries(this.array, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.mapSeries(this.array, this.neoAsyncIterator, callback);
      }
    }
  };
};
