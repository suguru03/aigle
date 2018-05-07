'use strict';

const path = require('path');

const _ = require('lodash');
const gulp = require('gulp');
const git = require('gulp-git');
const semver = require('semver');
const bump = require('gulp-bump');
const runSequence = require('run-sequence');
const tagVersion = require('gulp-tag-version');

const packagepath = path.resolve(__dirname, '../..', 'package.json');
const types = ['patch', 'minor', 'preminor-alpha', 'preminor-beta', 'major', 'premajor-alpha', 'premajor-beta'];

_.forEach(types, type => {
  gulp.task(`release:package:${type}`, updateVersion(type));
  gulp.task(`release:${type}`, () =>
    runSequence(`release:package:${type}`, 'build', 'release:commit', 'gh-pages', 'release:tag')
  );
});

gulp.task('release:tag', () => {
  return gulp.src(packagepath).pipe(tagVersion());
});

gulp.task('release:commit', () => {
  delete require.cache[packagepath];
  const { version } = require(packagepath);
  return gulp.src(['./dist/*', packagepath]).pipe(git.commit(version));
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
    return gulp
      .src(packagepath)
      .pipe(bump({ version }))
      .pipe(gulp.dest('./'));
  };
}
