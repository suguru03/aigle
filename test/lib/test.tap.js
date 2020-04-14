'use strict';

const assert = require('assert');
const parallel = require('mocha.parallel');

const Aigle = require('../../');

parallel('tap', () => {
  it('should work', () => {
    const collection = [1, 4, 2];
    return Aigle.tap(collection, (array) => array.pop()).then((res) => {
      assert.strictEqual(res, collection);
      assert.deepStrictEqual(res, [1, 4]);
    });
  });

  it('should work with primitive variable', () => {
    const value = 1;
    return Aigle.tap(value, (v) => ++v).then((res) => assert.strictEqual(res, 1));
  });
});

parallel('#tap', () => {
  it('should work', () => {
    const collection = [1, 4, 2];
    return Aigle.resolve(collection)
      .tap((array) => array.pop())
      .then((res) => {
        assert.strictEqual(res, collection);
        assert.deepStrictEqual(res, [1, 4]);
      });
  });

  it('should work with primitive variable', () => {
    const value = 1;
    return Aigle.resolve(value)
      .tap((v) => ++v)
      .then((res) => assert.strictEqual(res, 1));
  });
});
