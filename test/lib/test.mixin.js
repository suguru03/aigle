'use strict';

const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');

const Aigle = require('../../');
const { DELAY } = require('../config');

parallel('mixin', () => {

  it('should execute with function', () => {

    const test1 = value => value * 2;
    Aigle.mixin({ test1 }, { promisify: false });
    return Aigle.resolve(1)
      .test1()
      .then(value => assert.strictEqual(value, 2));
  });

  it('should execute with lodash function', () => {

    Aigle.mixin(_, { promisify: false });
    return Aigle.resolve([1, 2, 3])
      .sum()
      .then(value => assert.strictEqual(value, 6));
  });

  it('should execute with lodash function', () => {

    let sync = true;
    Aigle.mixin(_, { promisify: false });
    const promise = Aigle.sum([1, 2, 3])
      .then(value => {
        assert.strictEqual(value, 6);
        assert.strictEqual(sync, false);
      });
    sync = false;
    return promise;
  });

  it('should override Aigle functions', () => {

    Aigle.mixin({ map: _.map }, { override: true, promisify: false });
    return Aigle.delay(10, [1, 2, 3])
      .map(n => Aigle.delay(DELAY, n * 2))
      .then(array => {
        assert.ok(array[0] instanceof Aigle);
        return array;
      })
      .all()
      .then(value => assert.deepEqual(value [2, 4, 6]));
  });

  it('should execute with promisified iterator', () => {

    Aigle.mixin({ sortedUniqBy: _.sortedUniqBy }, { override: true });
    return Aigle.delay(10, [1.1, 1.4, 2.3, 2.5, 2.7])
      .sortedUniqBy(n => Aigle.delay(DELAY, Math.round(n)))
      .then(array => assert.deepEqual(array, [1.1, 2.3, 2.5]));
  });
});
