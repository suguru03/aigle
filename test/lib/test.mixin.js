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

  it('should execute with a static function', () => {

    Aigle.mixin({ sum: _.sum }, { override: true });
    return Aigle.sum([1, 2, 3])
      .then(value => assert.strictEqual(value, 6));
  });

  it('should execute with object', () => {

    Aigle.mixin({ countBy: _.countBy }, { override: true });
    const object = { a: 1.1, b: 1.4, c: 2.2 };
    return Aigle.delay(DELAY, object)
      .countBy(n => Aigle.delay(DELAY, Math.floor(n)))
      .then(object => assert.deepEqual(object, { '1': 2, '2': 1 }));
  });

  it('should catch an error', () => {

    const error = new Error('error');
    Aigle.mixin({ countBy: _.countBy }, { override: true });
    return Aigle.countBy([0, 1, 2], n => {
      return n % 2 ? Aigle.delay(DELAY, n) : Aigle.reject(error);
    })
    .then(assert.fail)
    .catch(err => assert.strictEqual(err, error));
  });

  it('should catch an error', () => {

    const error = new Error('error');
    Aigle.mixin({ countBy: _.countBy }, { override: true });
    return Aigle.countBy({ a: 0, b: 1, c: 2 }, n => {
      return n % 2 ? Aigle.delay(DELAY, n) : Aigle.reject(error);
    })
    .then(assert.fail)
    .catch(err => assert.strictEqual(err, error));
  });
});
