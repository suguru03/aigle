'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../proxy');
const { DELAY } = require('../config');

parallel('resolve', () => {

  it('should resolve', done => {

    const str = 'test';
    const p = Aigle.resolve(str);
    p.then(res => {
      assert.strictEqual(res, str);
      done();
    });
  });

  it('should ensure order', () => {

    let count = 0;
    return Aigle.all([
      Aigle.resolve()
        .then(() => assert.strictEqual(++count, 1)),
      Aigle.resolve()
        .then(() => assert.strictEqual(++count, 2)),
      Aigle.resolve()
        .then(() => assert.strictEqual(++count, 3))
    ])
    .then(() => assert.strictEqual(count, 3));
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

  it('should reject without unhandledRejection error', done => {

    const error = new Error('error');
    process.on('unhandledRejection', done);
    const p = Aigle.reject(error);
    p.catch(err => {
      assert.strictEqual(err, error);
      done();
    })
    .finally(() => process.removeListener('unhandledRejection', done));
  });

  it('should notify unhandledRejection', done => {

    const error = new Error('error');
    const callback = err => {
      assert(err);
      process.removeListener('unhandledRejection', callback);
      done();
    };
    process.on('unhandledRejection', callback);
    Aigle.reject(error);
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

  it('should execute with multiple receivers on synchronous', done => {

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

  it('should execute with multiple receivers on asynchronous', done => {

    let called = 0;
    const p = new Aigle(resolve => process.nextTick(() => resolve(0)));
    p.then(value => {
      assert.strictEqual(value, 0);
      assert.strictEqual(called++, 0);
      return new Aigle(resolve => {
        process.nextTick(() => resolve(++value));
      });
    });
    p.then(value => {
      assert.strictEqual(value, 0);
      assert.strictEqual(called++, 1);
      return new Aigle(resolve => {
        process.nextTick(() => resolve(++value));
      });
    });
    p.then(value => {
      assert.strictEqual(value, 0);
      assert.strictEqual(called++, 2);
      return new Aigle(resolve => {
        process.nextTick(() => resolve(++value));
      });
    })
    .then(value => {
      assert.strictEqual(value, 1);
    });
    p.then(value => {
      assert.strictEqual(value, 0);
      assert.strictEqual(called++, 3);
      return new Aigle(resolve => {
        process.nextTick(() => resolve(++value));
      });
    });
    setTimeout(() => {
      assert.strictEqual(called, 4);
      done();
    }, DELAY);
  });

  it('should execute with native Promise', done => {

    Aigle.resolve(1)
      .then(value => new Promise(resolve => {
        process.nextTick(() => resolve(++value));
      }))
      .then(value => new Promise(resolve => resolve(++value)))
      .then(value => {
        assert.strictEqual(value, 3);
        done();
      });
  });

  it('should execute a resolve function with promise object', done => {

    const promise = new Aigle(resolve => resolve(1));
    new Aigle(resolve => resolve(promise))
      .then(value => {
        assert.strictEqual(value, 1);
        done();
      });
  });

  it('should execute a reject function with promise object', done => {

    const error = new Error('error');
    const promise = new Aigle((resolve, reject) => reject(error));
    new Aigle(resolve => resolve(promise))
      .then(assert.fail)
      .catch(err => {
        assert.strictEqual(err, error);
        done();
      });
  });

  it('should not change status', done => {

    const str = 'success';
    const err = new Error('error');
    const p = new Aigle((resolve, reject) => {
      resolve(str);
      setTimeout(() => reject(err), DELAY);
    });

    p.then(value => assert.strictEqual(value, str));
    setTimeout(() => {
      p.then(value => {
        assert.strictEqual(value, str);
        done();
      });
      p.catch(done);
    }, DELAY * 2);
  });
});

describe('#catch', () => {

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

  it('should catch a TypeError from error type', done => {

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

  it('should catch a ReferenceError', done => {

    Aigle.resolve()
      .then(() => {
        test;
      })
      .catch(ReferenceError, err => {
        assert.ok(err);
        done();
      });
  });

  it('should catch a TypeError', done => {

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

  it('should catch an unhandled rejection error', done => {

    let called = false;
    const callback = err => {
      assert.ok(err);
      called = true;
    };
    process.on('unhandledRejection', callback);
    const p = Aigle.resolve()
      .then(() => {
        test;
      });
    setTimeout(() => {
      p.catch(ReferenceError, err => {
        assert.ok(err);
        assert.ok(called);
        done();
      })
      .catch(done)
      .finally(() => process.removeListener('unhandledRejection', callback));
    }, DELAY);
  });

  it('should just ignore if onRejected is not a function', done => {

    const error = new TypeError('error');
    Aigle.reject(error)
      .catch(TypeError, 'test')
      .catch(err => {
        assert.strictEqual(err, error);
        done();
      });
  });

  it('should caatch an error with multiple receivers on synchronous', done => {

    let called = 0;
    const error = new Error('error');
    const p = Aigle.reject(error);
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    setTimeout(() => {
      assert.strictEqual(called, 4);
      done();
    }, DELAY);
  });

  it('should caatch error with multiple receivers on asynchronous', done => {

    let called = 0;
    const error = new Error('error');
    const p = new Aigle((resolve, reject) => process.nextTick(() => reject(error)));
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    p.catch(err => {
      called++;
      assert.strictEqual(err, error);
    });
    setTimeout(() => {
      assert.strictEqual(called, 4);
      done();
    }, DELAY);
  });

  it('should catch TypeError caused by executor', done => {

    new Aigle(resolve => resolve.test())
      .catch(TypeError, error => {
        assert.ok(error instanceof TypeError);
        done();
      });
  });

  it('should catch ReferenceError in onRejected', done => {

    const error = new Error('error');
    Aigle.reject(error)
      .catch(err => {
        assert.strictEqual(err, error);
        test;
      })
      .catch(ReferenceError, error => {
        assert.ok(error instanceof ReferenceError);
        done();
      });
  });

  it('should catch error and call Aigle instance', done => {

    Aigle.reject(new TypeError('error'))
      .catch(error => {
        assert.ok(error instanceof Error);
        return Aigle.reject(new TypeError('error'));
      })
      .catch(ReferenceError, () => assert(false))
      .catch(TypeError, error => {
        assert.ok(error instanceof TypeError);
        return new Aigle((resolve, reject) => process.nextTick(() => {
          reject(new SyntaxError('error'));
        }));
      })
      .catch(SyntaxError, error => {
        assert.ok(error instanceof SyntaxError);
        return Aigle.resolve(new RangeError('error'));
      })
      .then(value => {
        assert.ok(value instanceof RangeError);
        done();
      });
  });

  it('should execute with native Promise', done => {

    Aigle.reject(1)
      .catch(value => new Promise((resolve, reject) => {
        process.nextTick(() => reject(++value));
      }))
      .catch(value => new Promise((resolve, reject) => {
        reject(++value);
      }))
      .catch(value => {
        assert.strictEqual(value, 3);
        done();
      });
  });

  it('should not call unhandledRejection', done => {

    process.on('unhandledRejection', done);
    new Aigle((resolve, reject) => reject('error'))
      .catch(error => {
        assert.strictEqual(error, 'error');
        done();
      })
      .finally(() => process.removeAllListeners('unhandledRejection'));
  });

  it('should not change status', done => {

    const str = 'success';
    const err = new Error('error');
    const p = new Aigle((resolve, reject) => {
      reject(err);
      setTimeout(() => resolve(str), DELAY);
    });

    p.then(done);
    p.catch(error => assert.strictEqual(error, err));
    setTimeout(() => {
      p.then(() => done('should be not called'));
      p.catch(error => {
        assert.strictEqual(error, err);
        done();
      });
    }, DELAY * 2);
  });

  it('should return an error with a rejected promise', done => {

    process.on('unhandledRejection', done);
    const error1 = new Error('error1');
    const error2 = new Error('error2');
    const promise = Aigle.reject(error1);
    promise.catch(error => assert.strictEqual(error, error1));
    Aigle.reject(error2)
      .catch(error => {
        assert.strictEqual(error, error2);
        return promise;
      })
      .catch(error => {
        assert.strictEqual(error, error1);
        done();
      })
      .finally(() => process.removeListener('unhandledRejection', done));
  });

  it('should not catch an error if a promise is fulfilled', done => {

    new Aigle(resolve => {
      resolve();
      throw new Error('error');
    })
    .catch(done)
    .delay(DELAY)
    .then(done);
  });
});

describe('#finally', () => {

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

  it('should execute finally function', done => {

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
      return new Aigle((resolve, reject) => {
        setTimeout(() => {
          called++;
          assert.strictEqual(called, 2);
          reject(new Error('error2'));
        }, DELAY);
      });
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

    let async = false;
    Aigle.resolve(1)
      .finally(value => {
        assert.strictEqual(value, undefined);
        assert.ok(async);
        done();
      });
    async = true;
  });

  it('should cause TypeError in handler', done => {

    Aigle.resolve(1)
      .finally(value => value.test())
      .catch(TypeError, error => {
        assert.ok(error instanceof TypeError);
        done();
      });
  });

  it('should execute with aigle instance', done => {

    Aigle.resolve(1)
      .finally(() => new Aigle(resolve => resolve(2)))
      .then(value => assert.strictEqual(value, 1))
      .finally(() => new Aigle((resolve, reject) => reject(3)))
      .catch(error => {
        assert.strictEqual(error, 3);
        done();
      });
  });

  it('should execute with error', done => {

    Aigle.reject(1)
      .finally(value => {
        assert.strictEqual(value, undefined);
        return new Promise(value => process.nextTick(() => value(2)));
      })
      .catch(error => {
        assert.strictEqual(error, 1);
        done();
      });
  });

  it('should return an error promise in finally function', done => {

    const promise = Aigle.reject(1);
    promise.catch(error => assert(error));
    Aigle.resolve()
      .finally(() => promise)
      .catch(error => {
        assert(error);
        done();
      });
  });

  it('should return an rejected promise', done => {

    const error = new TypeError('error');
    const promise = Aigle.reject(error);
    Aigle.resolve()
      .finally(() => promise)
      .catch(TypeError, err => assert(err, error))
      .finally(done);
  });
});

parallel('#toString', () => {

  it('should execute toString', () => {

    const promise = new Aigle(() => {});
    assert.strictEqual(promise.toString(), '[object Promise]');
  });
});
