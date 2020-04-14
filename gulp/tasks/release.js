'use strict';

const path = require('path');

const _ = require('lodash');
const gulp = require('gulp');
const fs = require('fs-extra');
const git = require('gulp-git');
const semver = require('semver');
const bump = require('gulp-bump');
const tagVersion = require('gulp-tag-version');

const Aigle = require('../../');
const { exec } = require('../util');

const packagepath = path.resolve(__dirname, '../..', 'package.json');
const types = [
  'patch',
  'minor',
  'preminor-alpha',
  'preminor-beta',
  'major',
  'premajor-alpha',
  'premajor-beta',
];

gulp.task('release:tag', () => {
  return gulp.src(packagepath).pipe(tagVersion());
});

gulp.task('release:commit', () => {
  delete require.cache[packagepath];
  const { version } = require(packagepath);
  return gulp.src(['./dist/*', packagepath]).pipe(git.commit(version));
});

gulp.task('release:package', createPackage);

_.forEach(types, (type) => {
  gulp.task(`release:package:${type}`, updateVersion(type));
  gulp.task(
    `release:${type}`,
    gulp.series(
      `release:package:${type}`,
      'build',
      // 'build:type',
      'release:commit',
      'gh-pages',
      'release:tag',
      'release:package'
    )
  );
});

function updateVersion(type) {
  return () => {
    const [release, identifier] = type.split('-');
    const prev = require(packagepath).version;
    const version = semver.inc(
      prev,
      identifier && new RegExp(identifier).test(prev) ? 'prerelease' : release,
      identifier
    );
    return gulp.src(packagepath).pipe(bump({ version })).pipe(gulp.dest('./'));
  };
}

async function createPackage() {
  const rootpath = path.join(__dirname, '../..');
  const buildpath = path.join(rootpath, 'build');

  await exec(`rm -rf ${buildpath}`);

  // make dir
  !fs.existsSync(buildpath) && fs.mkdirSync(buildpath);

  // copy lib
  fs.copySync(path.join(rootpath, 'lib'), path.join(buildpath, 'lib'));
  // copy a minified file
  fs.copySync(
    path.join(rootpath, 'dist', 'aigle-es5.min.js'),
    path.join(buildpath, 'aigle-es5.min.js')
  );

  // copy package.json
  const json = _.omit(require('../../package'), ['files', 'scripts', 'private']);
  json.main = 'lib/aigle';
  json.browser = 'aigle-es5.min.js';
  fs.writeFileSync(path.join(buildpath, 'package.json'), JSON.stringify(json, null, 2), 'utf8');

  // copy README
  fs.copySync(path.join(rootpath, 'README.md'), path.join(buildpath, 'README.md'));

  // create all function files
  const template = `module.exports = require('./aigle')`;
  _.forOwn(Aigle, (func, key) => {
    if (!_.isFunction(func) || /Error$|^Aigle$/.test(key)) {
      return;
    }
    const file = `${template}.${key};`;
    fs.writeFileSync(path.join(buildpath, `${_.camelCase(key)}.js`), file, 'utf8');
  });

  // craete aigle files
  const aigledirpath = path.join(buildpath, 'aigle');
  const pkg = { main: '../lib/aigle', browser: '../aigle-es5.min.js' };
  fs.mkdirSync(aigledirpath);
  fs.writeFileSync(path.join(aigledirpath, 'package.json'), JSON.stringify(pkg), 'utf8');

  // copy type files
  fs.copySync(path.join(rootpath, 'typings', 'aigle.d.ts'), path.join(buildpath, 'aigle.d.ts'));
}
