'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('flow', () => {
  const add = (a, b) => Aigle.delay(DELAY, a + b);
  const square = n => Aigle.delay(DELAY, n * n);

  it('should create a function and work properly', () => {
    const addSquare = Aigle.flow([add, square]);
    const promise = addSquare(1, 2);
    assert.ok(promise instanceof Aigle);
    return promise.then(data => assert.strict(data, 9));
  });
});
