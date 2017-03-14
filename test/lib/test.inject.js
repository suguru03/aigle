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

  it('should not inject', () => {

    return Aigle.resolve(1)
      .inject((a, b, c) => {
        assert.strictEqual(a, undefined);
        assert.strictEqual(b, undefined);
        assert.strictEqual(c, undefined);
      });
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
});
