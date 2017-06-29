'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');

const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('mixin', () => {

  let AigleTest;
  beforeEach(() => AigleTest = _.clone(Aigle));


  it('should execute with function', () => {

    const test1 = value => value * 2;
    AigleTest.mixin({ test1 });
    return AigleTest.resolve(1)
      .test1()
      .then(value => assert.strictEqual(value, 2));
  });

  it('should execute with lodash function', () => {

    AigleTest.mixin(_);
    return Aigle.resolve([1, 2, 3])
      .sum()
      .then(value => assert.strictEqual(value, 6));
  });

  it('should execute with lodash function', () => {

    let sync = true;
    AigleTest.mixin(_);
    const promise = Aigle.sum([1, 2, 3])
      .then(value => {
        assert.strictEqual(value, 6);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should override Aigle functions', () => {

    AigleTest.mixin({ map: _.map }, { override: true });
    return Aigle.delay(10, [1, 2, 3])
      .map(n => Aigle.delay(DELAY, n * 2))
      .then(array => {
        assert.ok(array[0] instanceof Aigle);
        return array;
      })
      .all()
      .then(value => assert.deepEqual(value [2, 4, 6]));
  });
});
