'use strict';

const path = require('path');

const _ = require('lodash');
const gulp = require('gulp');
const fs = require('fs-extra');

const Aigle = require('../../');
const { exec } = require('../util');

gulp.task('npm:publish', publish);

async function publish() {
  const rootpath = path.resolve(__dirname, '../..');
  const buildpath = path.resolve(rootpath, 'build');

  await exec(`rm -rf ${buildpath}`);

  // make dir
  !fs.existsSync(buildpath) && fs.mkdirSync(buildpath);

  // copy lib
  fs.copySync(path.resolve(rootpath, 'lib'), path.resolve(buildpath, 'lib'));

  // copy package.json
  const json = _.omit(require('../../package'), ['files', 'scripts']);
  json.main = 'aigle.js';
  fs.writeFileSync(path.resolve(buildpath, 'package.json'), JSON.stringify(json, null, 2), 'utf8');

  // copy README
  fs.copySync(path.resolve(rootpath, 'README.md'), path.resolve(buildpath, 'README.md'));

  // create all function files
  const template = fs.readFileSync(path.resolve(__dirname, '../template'), 'utf8');
  const aiglefile = template.replace(/require.*/, 'require(\'./lib/aigle\');');
  fs.writeFileSync(path.resolve(buildpath, 'aigle.js'), aiglefile, 'utf8');
  _.forOwn(Aigle, (func, key) => {
    if (!_.isFunction(func) || /Error$/.test(key)) {
      return;
    }
    const file = template.replace('<function>', key);
    fs.writeFileSync(path.resolve(buildpath, `${key}.js`), file, 'utf8');
  });

  await exec(`cd ${buildpath} && npm publish`);
}
