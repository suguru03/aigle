'use strict';

const path = require('path');

const gulp = require('gulp');
const argv = require('minimist')(process.argv.slice(2));

const { exec } = require('../util');
const pkg = require('../../package.json');

/**
 * gulp npm:publish --otp <code>
 */
gulp.task('npm:publish', async () => {
  const { otp } = argv;
  if (!otp) {
    throw new Error('Invalid otp');
  }
  const tag = /alpha|beta/.test(pkg.version) ? '--tag next' : '';
  const buildpath = path.join(__dirname, '../../build');
  await exec(`cd ${buildpath} && npm publish ${tag} --otp=${otp}`);
});
