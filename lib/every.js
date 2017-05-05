'use strict';

const { Each } = require('./each');
const { PENDING } = require('./internal/util');
const { setShorthand } = require('./internal/collection');

class Every extends Each {

  constructor(iterator, collection) {
    super(iterator, collection);
    this._result = true;
    if (collection === PENDING) {
      this._set = setShorthand;
    } else {
      setShorthand.call(this, collection);
    }
  }

  _callResolve(value) {
    if (!value) {
      this._promise._resolve(false);
    } else if (--this._rest === 0) {
      this._promise._resolve(true);
    }
  }
}

module.exports = { every, Every };

/**
 * @param {Array|Object} collection
 * @param {Function|Array|Object|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.every(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return true;
 *     });
 * };
 * Aigle.every(collection, iterator)
 *   .then(value => {
 *     console.log(value); // true
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return n % 2;
 *     });
 * };
 * Aigle.every(collection, iterator)
 *   .then(value => {
 *     console.log(value); // false
 *     console.log(order); // [1, 2];
 *   });
 *
 * @example
 * const collection = [{
 *  uid: 1, active: false
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.every(collection, 'active')
 *   .then(value => console.log(value)); // false
 *
 * @example
 * const collection = [{
 *  uid: 1, active: false
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.every(collection, ['active', true])
 *   .then(value => console.log(value)); // false
 *
 * @example
 * const collection = [{
 *  uid: 1, active: true
 * }, {
 *  uid: 4, active: true
 * }, {
 *  uid: 2, active: true
 * }];
 * Aigle.every(collection, { active: true })
 *   .then(value => console.log(value)); // true
 */
function every(collection, iterator) {
  return new Every(iterator, collection)._execute();
}
