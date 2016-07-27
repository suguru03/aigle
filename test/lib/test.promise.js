/* global it */
'use strict';

const assert = require('assert');

const parallel = require('mocha.parallel');
const Promise = require('../../');
const DELAY = require('../config').DELAY;

parallel('#Promise', () => {

  it('should resolve on synchronous', done => {

    let called = 0;
    new Promise(resolve => {
      resolve(0);
      ++called;
    })
    .then(value => {
      assert.strictEqual(value, 0);
      ++called;
      return ++value;
    })
    .then(value => {
      assert.strictEqual(value, 1);
      ++called;
    });
    setTimeout(() => {
      assert.strictEqual(called, 3);
      done();
    }, DELAY);
  });

  it('should resolve on asynchronous', done => {

    let called = 0;
    new Promise(resolve => {
      setTimeout(() => {
        resolve(0);
        called++;
      }, DELAY);
    })
    .then(value => {
      assert.strictEqual(value, 0);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(1);
          called++;
        }, DELAY);
      });
    })
    .then(value => {
      assert.strictEqual(value, 1);
      called++;
    });
    setTimeout(() => {
      assert.strictEqual(called, 3);
      done();
    }, DELAY * 3);
  });

  it('should catch an error', done => {

    var str = 'test';
    var called = 0;
    new Promise((resolve, reject) => {
      reject(new Error('error'));
      called++;
    })
    .catch(err => {
      assert.ok(err);
      called++;
      return str;
    })
    .then(res => {
      assert.strictEqual(res, str);
      called++;
    });
    setTimeout(() => {
      assert.strictEqual(called, 3);
      done();
    }, DELAY);
  });

  it('should catch TypeError from error type', done => {

    var str = 'test';
    var called = 0;
    new Promise((resolve, reject) => {
      reject(new TypeError('error'));
      called++;
    })
    .catch(ReferenceError, TypeError, err => {
      assert.ok(err);
      called++;
      return str;
    })
    // should not be called this function
    .catch(err => {
      assert(!err);
      called++;
    })
    .then(res => {
      assert.strictEqual(res, str);
      called++;
    });
    setTimeout(() => {
      assert.strictEqual(called, 3);
      done();
    }, DELAY);
  });
});
