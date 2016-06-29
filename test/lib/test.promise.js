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
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(++value);
        });
      });
    })
    .then(value => {
      assert.strictEqual(value, 1);
    });
  });
});
