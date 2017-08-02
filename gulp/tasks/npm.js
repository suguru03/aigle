'use strict';

const path = require('path');

const _ = require('lodash');
const gulp = require('gulp');
const fs = require('fs-extra');

const { exec } = require('../util');

gulp.task('npm:publish', publish);

async function publish() {
  const rootpath = path.resolve(__dirname, '../..');
  const buildpath = path.resolve(rootpath, 'build');

  // make dir
  !fs.existsSync(buildpath) && fs.mkdirSync(buildpath);

  // copy lib
  const libpath = path.resolve(rootpath, 'lib');
  fs.copySync(libpath, buildpath);

  // copy package.json
  const json = _.omit(require('../../package'), ['files', 'scripts']);
  json.main = 'aigle.js';
  const filepath = path.resolve(buildpath, 'package.json');
  fs.writeFileSync(filepath, JSON.stringify(json, null, 2), 'utf8');

  // copy README
  fs.copySync(path.resolve(rootpath, 'README.md'), path.resolve(buildpath, 'README.md'));

  // rewrite util
  const utilpath = path.resolve(buildpath, 'internal', 'util.js');
  const file = fs.readFileSync(utilpath, 'utf8').replace('../../package.json', '../package.json');
  fs.writeFileSync(utilpath, file, 'utf8');

  await exec(`cd ${buildpath} && npm publish`);
}
