'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird, neoAsync }) => {

  return {
    'map': {
      doc: true,
      setup: config => {
        this.array = _.times(config.count);
        this.aigleIterator = value => new Aigle(resolve => setImmediate(resolve, value * 2));
        this.bluebirdIterator = value => new Bluebird(resolve => setImmediate(resolve, value * 2));
      },
      aigle: () => {
        return Aigle.map(this.array, this.aigleIterator);
      },
      bluebird: () => {
        return Bluebird.map(this.array, this.bluebirdIterator);
      }
    },
    'map:array': {
      setup: config => {
        this.array = _.times(config.count);
        this.promiseIterator = value => value * 2;
        this.neoAsyncIterator = (n, cb) => cb(null, n * 2);
      },
      aigle: () => {
        return Aigle.map(this.array, this.promiseIterator);
      },
      bluebird: () => {
        return Bluebird.map(this.array, this.promiseIterator);
      },
      neoAsync: callback => {
        neoAsync.map(this.array, this.neoAsyncIterator, callback);
      }
    },
    'map:array:async': {
      setup: config => {
        this.array = _.times(config.count);
        this.aigleIterator = value => new Aigle(resolve => setImmediate(resolve, value * 2));
        this.bluebirdIterator = value => new Bluebird(resolve => setImmediate(resolve, value * 2));
        this.neoAsyncIterator = (n, cb) => setImmediate(cb, null, n * 2);
      },
      aigle: () => {
        return Aigle.map(this.array, this.aigleIterator);
      },
      bluebird: () => {
        return Bluebird.map(this.array, this.bluebirdIterator);
      },
      neoAsync: callback => {
        neoAsync.map(this.array, this.neoAsyncIterator, callback);
      }
    }
  };
};
