'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird }) => {

  return {
    'spread:10': {
      setup: () => {
        this._args = _.times(10, n => () => n);
        this._fn = () => {};
      },
      aigle: () => {
        return Aigle.resolve(this._args).spread(this._fn);
      },
      bluebird: () => {
        return Bluebird.resolve(this._args).spread(this._fn);
      }
    },
    'spread:100': {
      setup: () => {
        this._args = _.times(100, n => () => n);
        this._fn = () => {};
      },
      aigle: () => {
        return Aigle.resolve(this._args).spread(this._fn);
      },
      bluebird: () => {
        return Bluebird.resolve(this._args).spread(this._fn);
      }
    }
  };
};
