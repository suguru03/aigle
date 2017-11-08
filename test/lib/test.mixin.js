'use strict';

const path = require('path');
const assert = require('assert');

const _ = require('lodash');
const parallel = require('mocha.parallel');

const { DELAY } = require('../config');

parallel('mixin', () => {

  let Aigle;
  const aiglepath = path.resolve(__dirname, '../../lib/aigle.js');
  beforeEach(() => {
    Aigle = require(aiglepath);
    _.forOwn(require.cache, (v, key) => delete require.cache[key]);
  });

  it('should execute with function', () => {

    const test1 = value => value * 2;
    const obj = Aigle.mixin({ test1 }, { promisify: false });
    assert.strictEqual(obj, Aigle);
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

  /**
   * it('should allow the lodash chain', async () => {
   *   const lo = Aigle.mixin(_);
   *   const array = await lo.chain([1, 2, 3])
   *     .map(n => Aigle.delay(DELAY, n * 2))
   *     .value();
   *   assert.deepStrictEqual(array, [2, 4, 6]);
   *   assert.strictEqual(await lo.sum(array), 12);
   * });
   */

  it('should allow the lodash chain', () => {
    const lo = Aigle.mixin(_);
    return lo.chain([1, 2, 3])
      .map(n => Aigle.delay(DELAY, n * 2))
      .then(array => {
        assert.deepStrictEqual(array, [2, 4, 6]);
        return lo.sum(array);
      })
      .then(result => assert.strictEqual(result, 12));
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
      .then(value => assert.deepStrictEqual(value [2, 4, 6]));
  });

  it('should execute with a synchronous iterator', () => {

    Aigle.mixin({ sortedUniqBy: _.sortedUniqBy }, { override: true });
    return Aigle.delay(10, [1.1, 1.4, 2.3, 2.5, 2.7])
      .sortedUniqBy(Math.round)
      .then(array => assert.deepStrictEqual(array, [1.1, 2.3, 2.5]));
  });

  it('should execute with a asynchronous iterator', () => {

    Aigle.mixin({ sortedUniqBy: _.sortedUniqBy }, { override: true });
    return Aigle.delay(10, [1.1, 1.4, 2.3, 2.5, 2.7])
      .sortedUniqBy(n => Aigle.delay(DELAY, Math.round(n)))
      .then(array => assert.deepStrictEqual(array, [1.1, 2.3, 2.5]));
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
      .then(object => assert.deepStrictEqual(object, { '1': 2, '2': 1 }));
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

  it('should execute with object and catch an error', () => {

    const error = new Error('error');
    Aigle.mixin({ countBy: _.countBy }, { override: true });
    return Aigle.countBy({ a: 0, b: 1, c: 2 }, n => {
      return n % 2 ? Aigle.delay(DELAY, n) : Aigle.reject(error);
    })
    .then(assert.fail)
    .catch(err => assert.strictEqual(err, error));
  });
});
