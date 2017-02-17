'use strict';

module.exports = ({ Aigle, Bluebird }) => {

  class Resource {

    constructor() {
      this.closed = false;
      this._count = 0;
    }

    get() {
      return ++this._count;
    }

    close() {
      this.closed = true;
    }
  }

  return {
    'using': {
      doc: true,
      setup: () => {
        this.getAigleResorce = () => {
          return new Aigle(resolve => {
            setImmediate(() => resolve(new Resource()));
          }).disposer(resource => resource.close());
        };
        this.getBluebirdResorce = () => {
          return new Bluebird(resolve => {
            setImmediate(() => resolve(new Resource()));
          }).disposer(resource => resource.close());
        };
        this.iterator = () => {};
      },
      aigle: () => {
        return Aigle.using(this.getAigleResorce(), this.iterator);
      },
      bluebird: () => {
        return Bluebird.using(this.getBluebirdResorce(), this.iterator);
      }
    }
  };
};
