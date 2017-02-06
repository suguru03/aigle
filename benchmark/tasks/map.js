'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird, neoAsync }) => {

  return {
    'map:array': {
      doc: true,
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
      doc: true,
      setup: config => {
        this.array = _.times(config.count);
        this.promiseIterator = value => new Aigle(resolve => setImmediate(() => resolve(value * 2)));
        this.neoAsyncIterator = (n, cb) => setImmediate(() => cb(null, n * 2));
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
    }
  };
};
