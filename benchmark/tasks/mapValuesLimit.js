'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {
  return {
    'mapValuesLimit:object': {
      setup: config => {
        this.limit = 8;
        this.object = {};
        _.times(config.count, n => (this.object[n] = n));
        this.promiseIterator = value => value * 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n * 2);
      },
      aigle: () => {
        return Aigle.mapValuesLimit(this.object, this.limit, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.mapValuesLimit(this.object, this.limit, this.neoAsyncIterator, callback);
      }
    },
    'mapValuesLimit:object:async': {
      setup: config => {
        this.limit = 8;
        this.object = {};
        _.times(config.count, n => (this.object[n] = n));
        this.promiseIterator = value => new Aigle(resolve => setImmediate(resolve, value * 2));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb, null, n * 2);
      },
      aigle: () => {
        return Aigle.mapValuesLimit(this.object, this.limit, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.mapValuesLimit(this.object, this.limit, this.neoAsyncIterator, callback);
      }
    }
  };
};
