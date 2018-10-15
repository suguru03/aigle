'use strict';

const assert = require('assert');

const Aigle = require('../../');

const parallel = require('mocha.parallel');
const { DELAY } = require('../config');

class Resource {
  constructor() {
    this.closed = false;
    this._count = 0;
  }
  get() {
    return new Aigle(resolve =>
      setTimeout(() => {
        resolve(++this._count);
      }, DELAY)
    );
  }

  close() {
    return new Aigle(resolve =>
      setTimeout(() => {
        this.closed = true;
        resolve();
      }, DELAY)
    );
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
      assert.ok(resource instanceof Resource);
      assert.strictEqual(resource.closed, false);
      res = resource;
      return res.get();
    }).then(value => {
      assert.strictEqual(value, 1);
      assert(res instanceof Resource);
      assert(res.closed);
    });
  });

  it('should work on asynchronous', () => {
    let res;
    let async = false;
    return Aigle.using(getConnection(), resource => {
      assert.ok(resource instanceof Resource);
      assert.strictEqual(resource.closed, false);
      res = resource;
      return Aigle.delay(DELAY).then(() => (async = true));
    }).then(() => {
      assert(res instanceof Resource);
      assert(res.closed);
      assert(async);
    });
  });

  it('should get two connections', () => {
    return Aigle.using(getConnection(), getConnection(), 1, (r1, r2, r3) => {
      assert.ok(r1 instanceof Resource);
      assert.strictEqual(r1.closed, false);
      assert.ok(r2 instanceof Resource);
      assert.strictEqual(r1.closed, false);
      assert.strictEqual(r3, 1);
      return Aigle.all([r1.get(), r2.get(), r3]);
    }).then(array => assert.deepStrictEqual(array, [1, 1, 1]));
  });

  it('should cause an error', () => {
    let res;
    return Aigle.using(get(), getError(), () => assert(false))
      .catch(TestError, error => assert(error instanceof TestError))
      .then(() => {
        assert(res instanceof Resource);
        assert(res.closed);
      });

    function get() {
      return new Aigle(resolve => {
        setTimeout(() => {
          res = new Resource();
          resolve(res);
        }, DELAY);
      }).disposer(resource => resource.close());
    }
  });

  it('should ignore invalid last argument', () => {
    return Aigle.using(getConnection(), 'test').then(value => assert.strictEqual(value, undefined));
  });

  it('should throw an error if disposer causes error', () => {
    const disposer = new Aigle(resolve => {
      setTimeout(() => resolve(new Resource()), DELAY);
    }).disposer(resource => resource.test());
    return Aigle.using(disposer, () => assert(false)).catch(TypeError, assert);
  });

  it('should only call disposer which is not calused any errors when error is caused', () => {
    let res;
    const disposer1 = new Aigle(resolve => {
      setTimeout(() => {
        res = new Resource();
        resolve(res);
      }, DELAY);
    }).disposer(resource => resource.close());
    const error = new ReferenceError('error');
    const disposer2 = new Aigle((resolve, reject) => reject(error)).disposer(resource =>
      resource.close()
    );
    return Aigle.using(disposer1, disposer2, () => assert(false))
      .catch(ReferenceError, err => assert.strictEqual(err, error))
      .then(() => {
        assert(res);
        assert(res.closed);
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
