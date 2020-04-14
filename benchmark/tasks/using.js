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

  function create(resolve) {
    setImmediate(resolve, new Resource());
  }
  function dispose(resource) {
    resource.close();
  }

  return {
    using: {
      doc: true,
      setup: () => {
        this.getAigleResorce = () => new Aigle(create).disposer(dispose);
        this.getBluebirdResorce = () => new Bluebird(create).disposer(dispose);
        this.iterator = () => {};
      },
      aigle: () => {
        return Aigle.using(this.getAigleResorce(), this.iterator);
      },
      bluebird: () => {
        return Bluebird.using(this.getBluebirdResorce(), this.iterator);
      },
    },
  };
};
