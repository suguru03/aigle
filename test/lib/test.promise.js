'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Promise = require('../../');
const DELAY = require('../config').DELAY;

parallel('#Promise', () => {

  it('should resolve on synchronous', done => {

    let called = 0;
    new Promise(resolve => {
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
    new Promise(resolve => {
      setTimeout(() => {
        called++;
        resolve(0);
      }, DELAY);
    })
    .then(value => {
      assert.strictEqual(value, 0);
      return new Promise(resolve => {
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

  it('should catch an error', done => {

    const str = 'test';
    let called = 0;
    new Promise((resolve, reject) => {
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
    new Promise((resolve, reject) => {
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

  it('should execute', done => {

    new Promise(resolve => {
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

  it('should resolve', done => {

    const str = 'test';
    const p = Promise.resolve(str);
    p.then(res => {
      assert.strictEqual(res, str);
      done();
    });
  });

  it('should reject', done => {

    let called = 0;
    const err = new Error('error');
    const p = Promise.reject(err);
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

  it('should call finally function', done => {

    let called = 0;
    const err = new Error('error');
    const p = Promise.reject(err);
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
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          called++;
          assert.strictEqual(called, 2);
          reject(new Error('error2'));
        }, DELAY);
      });
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

  it('should re-call', done => {

    const p = new Promise(resolve => {
      resolve(1);
    });
    Promise.resolve()
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

    const p = new Promise(resolve => resolve(0));
    p.then(value => ++value);
    p.then(value => {
      assert.strictEqual(value, 0);
      done();
    });
  });

  it('should catch ReferenceError', done => {

    Promise.resolve()
      .then(() => {
        test;
      })
      .catch(ReferenceError, err => {
        assert.ok(err);
        done();
      });
  });

  it('should catch TypeError', done => {

    Promise.resolve()
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
    const p = Promise.resolve()
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
