'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird, neoAsync }) => {
  return {
    mapSeries: {
      doc: true,
      setup: (config) => {
        this.array = _.times(config.count);
        this.aigleIterator = (value) => new Aigle((resolve) => setImmediate(resolve, value * 2));
        this.bluebirdIterator = (value) =>
          new Bluebird((resolve) => setImmediate(resolve, value * 2));
      },
      aigle: () => {
        return Aigle.mapSeries(this.array, this.aigleIterator);
      },
      bluebird: () => {
        return Bluebird.mapSeries(this.array, this.bluebirdIterator);
      },
    },
    'mapSeries:class': {
      doc: true,
      setup: (config) => {
        this.array = _.times(config.count);
        this.aigle = Aigle.resolve(this.array);
        this.bluebird = Bluebird.resolve(this.array);
        this.aigleIterator = (value) => new Aigle((resolve) => setImmediate(resolve, value * 2));
        this.bluebirdIterator = (value) =>
          new Bluebird((resolve) => setImmediate(resolve, value * 2));
      },
      aigle: () => {
        return this.aigle.mapSeries(this.aigleIterator);
      },
      bluebird: () => {
        return this.bluebird.mapSeries(this.bluebirdIterator);
      },
    },
    'mapSeries:array': {
      setup: (config) => {
        this.array = _.times(config.count);
        this.promiseIterator = (value) => value * 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n * 2);
      },
      aigle: () => {
        return Aigle.mapSeries(this.array, this.promiseIterator);
      },
      bluebird: () => {
        return Bluebird.mapSeries(this.array, this.promiseIterator);
      },
      neoAsync: (callback) => {
        neoAsync.mapSeries(this.array, this.neoAsyncIterator, callback);
      },
    },
    'mapSeries:array:async': {
      setup: (config) => {
        this.array = _.times(config.count);
        this.promiseIterator = (value) => new Aigle((resolve) => setImmediate(resolve, value * 2));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb, null, n * 2);
      },
      aigle: () => {
        return Aigle.mapSeries(this.array, this.promiseIterator);
      },
      bluebird: () => {
        return Bluebird.mapSeries(this.array, this.promiseIterator);
      },
      neoAsync: (callback) => {
        neoAsync.mapSeries(this.array, this.neoAsyncIterator, callback);
      },
    },
  };
};
