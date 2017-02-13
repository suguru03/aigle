'use strict';

const path = require('path');

if (process.env.CI) {
  console.log('Disable mocha.parallel');
  require('mocha.parallel');
  const mochaParallelPath = path.resolve(__dirname, '..', 'node_modules', 'mocha.parallel', 'index.js');
  require.cache[mochaParallelPath].exports = describe;
}

const DELAY = process.env.DELAY || 20;

exports.DELAY = DELAY;
