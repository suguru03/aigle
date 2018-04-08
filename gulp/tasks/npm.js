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
  // copy a minified file
  fs.copySync(path.resolve(rootpath, 'dist', 'aigle-es5.min.js'), path.resolve(buildpath, 'aigle-es5.min.js'));

  // copy package.json
  const json = _.omit(require('../../package'), ['files', 'scripts', 'private']);
  json.main = 'aigle.js';
  json.browser = 'aigle-es5.min.js';
  fs.writeFileSync(path.resolve(buildpath, 'package.json'), JSON.stringify(json, null, 2), 'utf8');

  // copy README
  fs.copySync(path.resolve(rootpath, 'README.md'), path.resolve(buildpath, 'README.md'));

  // create all function files
  const template = fs.readFileSync(path.resolve(__dirname, '../template'), 'utf8');
  const aiglefile = template.replace(/require.*/, "require('./lib/aigle');");
  fs.writeFileSync(path.resolve(buildpath, 'aigle.js'), aiglefile, 'utf8');
  _.forOwn(Aigle, (func, key) => {
    if (!_.isFunction(func) || /Error$/.test(key)) {
      return;
    }
    const file = template.replace('<function>', key);
    fs.writeFileSync(path.resolve(buildpath, `${key}.js`), file, 'utf8');
  });

  // copy type files
  fs.copySync(path.resolve(rootpath, 'typings', 'aigle.d.ts'), path.resolve(buildpath, 'aigle.d.ts'));

  // TODO: enable tag from v1.13-alpha
  // const tag = /alpha|beta/.test(json.version) ? '--tag next' : '';
  const tag = '';

  await exec(`cd ${buildpath} && npm publish ${tag}`);
}
