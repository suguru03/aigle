'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const DELAY = require('../config').DELAY;

parallel('resolve', () => {

  it('should resolve', done => {

    const str = 'test';
    const p = Aigle.resolve(str);
    p.then(res => {
      assert.strictEqual(res, str);
      done();
    });
  });

});

parallel('reject', () => {

  it('should reject', done => {

    let called = 0;
    const err = new Error('error');
    const p = Aigle.reject(err);
    p.then(res => {
      assert(false);
      called++;
      return res;
    })
    .catch(err => {
      assert.ok(err);
      called++;
      return err;
    })
    .then(err => {
      assert.ok(err);
      called++;
      assert.strictEqual(called, 2);
      done();
    });
  });
});

parallel('#then', () => {

  it('should resolve on synchronous', done => {

    let called = 0;
    new Aigle(resolve => {
      resolve(0);
      ++called;
    })
    .then(value => {
      assert.strictEqual(value, 0);
      ++called;
      return ++value;
    })
    .then(value => {
      assert.strictEqual(value, 1);
      ++called;
      assert.strictEqual(called, 3);
      done();
    });
  });

  it('should resolve on asynchronous', done => {

    let called = 0;
    new Aigle(resolve => {
      setTimeout(() => {
        called++;
        resolve(0);
      }, DELAY);
    })
    .then(value => {
      assert.strictEqual(value, 0);
      return new Aigle(resolve => {
        setTimeout(() => {
          called++;
          resolve(1);
        }, DELAY);
      });
    })
    .then(value => {
      assert.strictEqual(value, 1);
      called++;
      assert.strictEqual(called, 3);
      done();
    });
  });

  it('should re-call', done => {

    const p = new Aigle(resolve => {
      resolve(1);
    });
    Aigle.resolve()
      .then(() => {
        return p;
      })
      .then(value => {
        assert.strictEqual(value, 1);
        return p;
      })
      .then(value => {
        assert.strictEqual(value, 1);
        const p2 = p.then(() => {
          return 2;
        })
        .then(value => {
          assert.strictEqual(value, 2);
          p.then(value => {
            assert.strictEqual(value, 1);
            p2.then(value => {
              assert.strictEqual(value, 3);
              done();
            });
          });
          return 3;
        });
      });
  });

  it('should re-call on synchronous', done => {

    let called = 0;
    const p = new Aigle(resolve => resolve(0));
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return ++value;
    });
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return ++value;
    });
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return ++value;
    });
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return ++value;
    });
    setTimeout(() => {
      assert.strictEqual(called, 4);
      done();
    }, DELAY);
  });

  it('should re-call on asynchronous', done => {

    let called = 0;
    const p = new Aigle(resolve => setImmediate(() => resolve(0)));
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return new Aigle(resolve => {
        setImmediate(() => resolve(++value));
      });
    });
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return new Aigle(resolve => {
        setImmediate(() => resolve(++value));
      });
    });
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return new Aigle(resolve => {
        setImmediate(() => resolve(++value));
      });
    })
    .then(value => {
      assert.strictEqual(value, 1);
    });
    p.then(value => {
      called++;
      assert.strictEqual(value, 0);
      return new Aigle(resolve => {
        setImmediate(() => resolve(++value));
      });
    });
    setTimeout(() => {
      assert.strictEqual(called, 4);
      done();
    }, DELAY);
  });

});

parallel('#catch', () => {

  it('should catch an error', done => {

    const str = 'test';
    let called = 0;
    new Aigle((resolve, reject) => {
      reject(new Error('error'));
      called++;
    })
    .catch(err => {
      assert.ok(err);
      called++;
      return str;
    })
    .then(res => {
      assert.strictEqual(res, str);
      called++;
      assert.strictEqual(called, 3);
      done();
    });
  });

  it('should catch TypeError from error type', done => {

    const str = 'test';
    let called = 0;
    new Aigle((resolve, reject) => {
      reject(new TypeError('error'));
      called++;
    })
    .catch(ReferenceError, TypeError, err => {
      assert.ok(err);
      called++;
      return str;
    })
    // should not be called this function
    .catch(err => {
      assert(false);
      called++;
      return err;
    })
    .then(res => {
      assert.strictEqual(res, str);
      called++;
      assert.strictEqual(called, 3);
      done();
    });
  });

  it('should catch ReferenceError', done => {

    Aigle.resolve()
      .then(() => {
        test;
      })
      .catch(ReferenceError, err => {
        assert.ok(err);
        done();
      });
  });

  it('should catch TypeError', done => {

    Aigle.resolve()
      .then(() => {
        const test = 1;
        test.test();
      })
      .catch(TypeError, err => {
        assert.ok(err);
        done();
      });
  });

  it('should catch Unhandled rejection error', done => {

    let called = false;
    process.on('unhandledRejection', err => {
      assert.ok(err);
      called = true;
    });
    const p = Aigle.resolve()
      .then(() => {
        test;
      });
    setTimeout(() => {
      p.catch(ReferenceError, err => {
        assert.ok(err);
        assert.ok(called);
        done();
      });
    }, DELAY);
  });

});

parallel('#finally', () => {

  it('should ignore empty arugment calls', done => {

    new Aigle(resolve => {
      process.nextTick(() => resolve(1));
    })
    .then(2)
    .catch()
    .finally()
    .then(res => {
      assert.strictEqual(res, 1);
      done();
    });
  });

  it('should call finally function', done => {

    let called = 0;
    const err = new Error('error');
    const p = Aigle.reject(err);
    p.then(res => {
      assert(false);
      called++;
      return res;
    })
    .catch(err => {
      assert.ok(err);
      called++;
      return err;
    })
    .finally(() => {
      const p = new Aigle((resolve, reject) => {
        setTimeout(() => {
          called++;
          assert.strictEqual(called, 2);
          reject(new Error('error2'));
        }, DELAY);
      });
      return p;
    })
    .then(() => {
      assert(false);
      called++;
      return 'then';
    })
    .catch(err => {
      assert.ok(err);
      assert.strictEqual(err.message, 'error2');
      called++;
      assert.strictEqual(called, 3);
      return 'catch';
    })
    .finally(() => {
      called++;
      assert.strictEqual(called, 4);
      return 'finally';
    })
    .then(res => {
      assert.strictEqual(res, 'catch');
      called++;
      assert.strictEqual(called, 5);
      done();
    });
  });

  it('should call on asynchronous', done => {

    Aigle.resolve(1)
      .finally(value => {
        assert.strictEqual(value, undefined);
        done();
      });
  });
});

parallel('#toString', () => {

  it('should execute toString', () => {

    const promise = new Aigle(() => {});
    assert.strictEqual(promise.toString(), '[object Promise]');
  });
});
