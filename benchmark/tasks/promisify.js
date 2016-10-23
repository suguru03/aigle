'use strict';

module.exports = ({ Aigle, Bluebird }) => {

  return {
    'promisify:simple': {
      setup: () => {
        this.func = callback => setImmediate(callback);
      },
      aigle: () => {
        return Aigle.promisify(this.func)();
      },
      bluebird: () => {
        return Bluebird.promisify(this.func)();
      }
    },
    'promisify:multiple': {
      setup: () => {
        this.func = (a, b, c, callback) => setImmediate(callback);
      },
      aigle: () => {
        return Aigle.promisify(this.func)(1, 2, 3);
      },
      bluebird: () => {
        return Bluebird.promisify(this.func)(1, 2, 3);
      }
    }
  };
};
