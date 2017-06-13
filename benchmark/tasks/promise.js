'use strict';

const _ = require('lodash');

let count = 0;

module.exports = ({ Aigle, Bluebird }) => {

  return {
    'promise:then': {
      doc: true,
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        let p = new Aigle(resolve => setImmediate(resolve, 0));
        _.times(count, () => {
          p = p.then(value => new Aigle(resolve => setImmediate(resolve, value)));
        });
        return p;
      },
      bluebird: () => {
        let p = new Bluebird(resolve => setImmediate(resolve, 0));
        _.times(count, () => {
          p = p.then(value => new Bluebird(resolve => setImmediate(resolve, value)));
        });
        return p;
      },
      'native': () => {
        let p = new Promise(resolve => setImmediate(resolve, 0));
        _.times(count, () => {
          p = p.then(value => new Promise(resolve => setImmediate(resolve, value)));
        });
        return p;
      }
    },
    'promise:resolve': {
      aigle: () => Aigle.resolve(),
      bluebird: () => Bluebird.resolve(),
      'native': () => Promise.resolve()
    },
    'promise:resume': {
      setup: () => {
        this.aigle = Aigle.resolve();
        this.bluebird = Bluebird.resolve();
      },
      aigle: () => this.aigle,
      bluebird: () => this.bluebird
    },
    'promise:single': {
      aigle: () => {
        return new Aigle(resolve => resolve(0));
      },
      bluebird: () => {
        return new Bluebird(resolve => resolve(0));
      }
    },
    'promise:single:async': {
      aigle: () => {
        return new Aigle(resolve => setImmediate(resolve, 0));
      },
      bluebird: () => {
        return new Bluebird(resolve => setImmediate(resolve, 0));
      }
    },
    'promise:multiple': {
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        let p = new Aigle(resolve => resolve(0));
        _.times(count, () => p = p.then(value => ++value));
        return p;
      },
      bluebird: () => {
        let p = new Bluebird(resolve => resolve(0));
        _.times(count, () => p = p.then(value => ++value));
        return p;
      }
    },
    'promise:multiple:async': {
      setup: config => {
        count = config.count;
      },
      aigle: () => {
        let p = new Aigle(resolve => setImmediate(resolve, 0));
        _.times(count, () => {
          p = p.then(value => new Aigle(resolve => setImmediate(resolve, value)));
        });
        return p;
      },
      bluebird: () => {
        let p = new Bluebird(resolve => setImmediate(resolve, 0));
        _.times(count, () => {
          p = p.then(value => new Bluebird(resolve => setImmediate(resolve, value)));
        });
        return p;
      }
    }
  };
};
