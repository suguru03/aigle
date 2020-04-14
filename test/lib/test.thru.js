'use strict';

const assert = require('assert');
const parallel = require('mocha.parallel');

const Aigle = require('../../');

parallel('thru', () => {
  it('should work with executor', () => {
    const value = 1;
    return Aigle.thru(value, (v) => ++v).then((res) => assert.strictEqual(res, 2));
  });

  it('should work withuout executor', () => {
    const collection = [1, 4, 2];
    return Aigle.thru(collection).then((res) => assert.strictEqual(res, collection));
  });
});

parallel('#thru', () => {
  it('should work with executor', () => {
    const value = 1;
    return Aigle.resolve(value)
      .thru((v) => ++v)
      .then((res) => assert.strictEqual(res, 2));
  });

  it('should work withuout executor', () => {
    const collection = [1, 4, 2];
    return Aigle.resolve(collection)
      .thru()
      .then((res) => assert.strictEqual(res, collection));
  });
});
