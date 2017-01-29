'use strict';

const _ = require('lodash');

module.exports = ({ Aigle, Bluebird }) => {

  let count;

  return {
    'promise:props': {
      setup: config => count = config.count,
      aigle: () => {
        const tasks = _.chain(count)
          .times()
          .transform((result, n) => {
            result[n] = new Aigle(resolve => resolve(n));
          }, {})
          .value();
        return Aigle.props(tasks);
      },
      bluebird: () => {
        const tasks = _.chain(count)
          .times()
          .transform((result, n) => {
            result[n] = new Bluebird(resolve => resolve(n));
          }, {})
          .value();
        return Bluebird.props(tasks);
      }
    },
    'promise:props:async': {
      setup: config => count = config.count,
      aigle: () => {
        const tasks = _.chain(count)
          .times()
          .transform((result, n) => {
            result[n] = new Aigle(resolve => setImmediate(resolve));
          }, {})
          .value();
        return Aigle.props(tasks);
      },
      bluebird: () => {
        const tasks = _.chain(count)
          .times()
          .transform((result, n) => {
            result[n] = new Bluebird(resolve => setImmediate(resolve));
          }, {})
          .value();
        return Bluebird.props(tasks);
      }
    }
  };
};
