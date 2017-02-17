'use strict';

const assert = require('assert');

const Aigle = require('../../');

const parallel = require('mocha.parallel');
const DELAY = require('../config').DELAY;

class Resource {

  constructor() {
    this.closed = false;
    this._count = 0;
  }
  get() {
    return new Aigle(resolve => setTimeout(() => {
      resolve(++this._count);
    }, DELAY));
  }

  close() {
    return new Aigle(resolve => setTimeout(() => {
      this.closed = true;
      resolve();
    }, DELAY));
  }
}

class TestError extends Error {

  constructor(message) {
    super(message);
  }
}

parallel('using', () => {

  it('should work', () => {

    let res;
    return Aigle.using(getConnection(), resource => {
      assert(resource instanceof Resource);
      assert(resource.closed === false);
      res = resource;
      return res.get();
    })
    .then(value => {
      assert.strictEqual(value, 1);
      assert(res instanceof Resource);
      assert(res.closed);
    });
  });

  it('should work on asynchronous', () => {
    let res;
    let async = false;
    return Aigle.using(getConnection(), resource => {
      assert(resource instanceof Resource);
      assert(resource.closed === false);
      res = resource;
      return Aigle.delay(DELAY)
        .then(() => async = true);
    })
    .then(() => {
      assert(res instanceof Resource);
      assert(res.closed);
      assert(async);
    });
  });

  it('should get two connections', () => {

    return Aigle.using(getConnection(), getConnection(), 1, (r1, r2, r3) => {
      assert(r1 instanceof Resource);
      assert(r1.closed === false);
      assert(r2 instanceof Resource);
      assert(r2.closed === false);
      assert.strictEqual(r3, 1);
      return Aigle.all([r1.get(), r2.get(), r3]);
    })
    .then(array => assert.deepEqual(array, [1, 1, 1]));
  });

  it('should cause an error', () => {

    return Aigle.using(getConnection(), getError(), () => {
      assert(false);
    })
    .catch(TestError, error => {
      assert(error instanceof TestError);
    });
  });

});

function getConnection() {
  return new Aigle(resolve => {
    setTimeout(() => resolve(new Resource()), DELAY);
  }).disposer(resource => resource.close());
}


function getError() {
  return new Aigle((resolve, reject) => {
    setTimeout(() => reject(new TestError('getError')), DELAY);
  });
}
