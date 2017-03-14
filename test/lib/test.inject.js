'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');

parallel('#inject', () => {

  it('should inject', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return Aigle.resolve(object)
      .inject((b, c, d, a) => {
        assert.strictEqual(a, object.a);
        assert.strictEqual(b, object.b);
        assert.strictEqual(c, object.c);
        assert.strictEqual(d, undefined);
      });
  });

  it('should inject on asynchronous', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return new Aigle(resolve => setImmediate(() => resolve(object)))
      .inject((b, c, d, a) => {
        assert.strictEqual(a, object.a);
        assert.strictEqual(b, object.b);
        assert.strictEqual(c, object.c);
        assert.strictEqual(d, undefined);
      });
  });

  it('should work with an empty object', () => {

    const object = {};
    return Aigle.resolve(object)
      .inject((b, c, d, a) => {
        assert.strictEqual(a, undefined);
        assert.strictEqual(b, undefined);
        assert.strictEqual(c, undefined);
        assert.strictEqual(d, undefined);
      });
  });

  it('should inject with an object which has a key', () => {

    const object = { a: 1 };
    return Aigle.resolve(object)
      .inject((b, c, d, a) => {
        assert.strictEqual(a, object.a);
        assert.strictEqual(b, undefined);
        assert.strictEqual(c, undefined);
        assert.strictEqual(d, undefined);
      });
  });

  it('should inject with an object which has two keys', () => {

    const object = { a: 1, c: 2 };
    return Aigle.resolve(object)
      .inject((b, c, d, a) => {
        assert.strictEqual(a, object.a);
        assert.strictEqual(b, undefined);
        assert.strictEqual(c, object.c);
        assert.strictEqual(d, undefined);
      });
  });


  it('should not inject', () => {

    return Aigle.resolve(1)
      .inject((a, b, c) => {
        assert.strictEqual(a, undefined);
        assert.strictEqual(b, undefined);
        assert.strictEqual(c, undefined);
      });
  });

  it('should work with a function which doesn\'t have any argument', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return Aigle.resolve(object)
      .inject(() => assert.ok(true));
  });

  it('should work with a function which has an argument', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return Aigle.resolve(object)
      .inject((c) => assert.strictEqual(c, object.c));
  });

  it('should work with a function which has two arguments', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return Aigle.resolve(object)
      .inject((b, c) => {
        assert.strictEqual(b, object.b);
        assert.strictEqual(c, object.c);
      });
  });

  it('should work with a function which has three arguments', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return Aigle.resolve(object)
      .inject((b, c, a) => {
        assert.strictEqual(a, object.a);
        assert.strictEqual(b, object.b);
        assert.strictEqual(c, object.c);
      });
  });

  it.skip('should work with a function which has an argument using shorthand', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return Aigle.resolve(object)
      .inject(c => assert.strictEqual(c, object.c));
  });


  it('should not execute if error is caused', () => {

    const array = [1, 2, 3];
    const error = new Error('error');
    return Aigle.resolve(array)
      .then(() => Aigle.reject(error))
      .inject(() => assert.ok(false))
      .catch(err => assert.strictEqual(err, error));
  });

  it('should throw TypeError', () => {

    return Aigle.resolve('test')
      .inject(arg1 => arg1())
      .then(() => assert(false))
      .catch(TypeError, error => assert.ok(error));
  });

  it('should throw ReferenceError if error is caused in inject', () => {

    const object = {
      a: 1,
      b: 4,
      c: 2
    };
    return Aigle.resolve(object)
      .inject(b => {
        assert.strictEqual(b, object.b);
        test;
      })
      .catch(ReferenceError, error => assert.ok(error));
  });
});
