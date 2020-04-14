'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, neoAsync }) => {
  return {
    'mapValues:object': {
      setup: (config) => {
        this.object = {};
        _.times(config.count, (n) => (this.object[n] = n));
        this.promiseIterator = (value) => value * 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n * 2);
      },
      aigle: () => {
        return Aigle.mapValues(this.object, this.promiseIterator);
      },
      neoAsync: (callback) => {
        neoAsync.mapValues(this.object, this.neoAsyncIterator, callback);
      },
    },
    'mapValues:object:async': {
      setup: (config) => {
        this.object = {};
        _.times(config.count, (n) => (this.object[n] = n));
        this.promiseIterator = (value) => new Aigle((resolve) => setImmediate(resolve, value * 2));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb, null, n * 2);
      },
      aigle: () => {
        return Aigle.mapValues(this.object, this.promiseIterator);
      },
      neoAsync: (callback) => {
        neoAsync.mapValues(this.object, this.neoAsyncIterator, callback);
      },
    },
  };
};
