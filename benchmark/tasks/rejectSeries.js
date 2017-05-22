'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {

  return {
    'rejectSeries:array': {
      setup: config => {
        this.array = _.times(config.count);
        this.promiseIterator = value => value % 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n % 2);
      },
      aigle: () => {
        return Aigle.rejectSeries(this.array, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.rejectSeries(this.array, this.neoAsyncIterator, callback);
      }
    },
    'rejectSeries:array:async': {
      setup: config => {
        this.array = _.times(config.count);
        this.promiseIterator = value => new Aigle(resolve => process.nextTick(resolve, value % 2));
        this.neoAsyncIterator = (n, cb) => process.nextTick(cb, null, n % 2);
      },
      aigle: () => {
        return Aigle.rejectSeries(this.array, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.rejectSeries(this.array, this.neoAsyncIterator, callback);
      }
    }
  };
};
