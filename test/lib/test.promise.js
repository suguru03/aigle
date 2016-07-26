/* global it */

'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
let Promise = require('../../');

parallel('#Promise', () => {

  it('should resolve on synchronous', () => {
    return new Promise(resolve => {
      resolve(0);
    })
    .then(value => {
      assert.strictEqual(value, 0);
      return ++value;
    })
    .then(value => {
      assert.strictEqual(value, 1);
      return ++value;
    });
  });

  it('should catch an error', () => {

    var str = 'test';
    return new Promise((resolve, reject) => {
      reject(new Error('error'));
    })
    .catch(err => {
      assert.ok(err);
      return str;
    })
    .then(res => {
      assert.strictEqual(res, str);
    });
  });
});
