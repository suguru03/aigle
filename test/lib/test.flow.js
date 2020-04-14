'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('flow', () => {
  const add = (a, b) => Aigle.delay(DELAY, a + b);
  const square = (n) => Aigle.delay(DELAY, n * n);

  it('should create a function and work properly', () => {
    const addSquare = Aigle.flow([add, square]);
    const promise = addSquare(1, 2);
    assert.ok(promise instanceof Aigle);
    return promise.then((data) => assert.strictEqual(data, 9));
  });

  it('should create a function with arguments', () => {
    const addSquare = Aigle.flow(add, square);
    return addSquare(1, 2).then((data) => assert.strictEqual(data, 9));
  });

  it('should work with a funciton', () => {
    const addSquare = Aigle.flow(add);
    return addSquare(1, 2).then((data) => assert.strictEqual(data, 3));
  });

  it('should work without any functions', () => {
    return Aigle.flow()(1, 2).then((val) => assert.strictEqual(val, 1));
  });

  it('should throw an error', () => {
    const err = new Error('error');
    const throwError = () => {
      throw err;
    };
    return Aigle.flow(
      add,
      throwError,
      square
    )(1, 2)
      .then(() => assert.ok(false))
      .catch((error) => {
        assert.strictEqual(error, err);
      });
  });
});
