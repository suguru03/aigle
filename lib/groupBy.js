'use strict';

const { Each } = require('./each');
const { setShorthand } = require('./internal/collection');

class GroupBy extends Each {
  constructor(collection, iterator) {
    super(collection, iterator, set);
    this._result = {};
  }
}

module.exports = { groupBy, GroupBy };

function set(collection) {
  setShorthand.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[index]);
  } else {
    this._result[key] = [this._coll[index]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

function callResolveObject(key, index) {
  if (this._result[key]) {
    this._result[key].push(this._coll[this._keys[index]]);
  } else {
    this._result[key] = [this._coll[this._keys[index]]];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  }
}

/**
 * @param {Array|Object} collection
 * @param {Function|string} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1] };
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.groupBy(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '0': [2, 4], '1': [1] };
 *     console.log(order); // [1, 2, 4];
 *   });
 *
 * @example
 * const order = [];
 * const collection = ['one', 'two', 'three'];
 * Aigle.groupBy(collection, 'length')
 *   .then(object => {
 *     console.log(object); // { '3': ['one', 'two'], '5': ['three'] };
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.groupBy(collection, ['active', true])
 *   .then(object => {
 *     console.log(object);
 *     // { 'true': [{ name: 'fread', active: true }], 'false': [{ name: 'bargey', active: false }];
 *   });
 *
 * @example
 * const collection = [{
 *   name: 'bargey', active: false
 * }, {
 *   name: 'fread', active: true
 * }];
 * Aigle.groupBy(collection, { active: true })
 *   .then(object => {
 *     console.log(object);
 *     // { 'true': [{ name: 'fread', active: true }], 'false': [{ name: 'bargey', active: false }];
 *   });
 */
function groupBy(collection, iterator) {
  return new GroupBy(collection, iterator)._execute();
}
