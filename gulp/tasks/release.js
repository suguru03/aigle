'use strict';

const path = require('path');

const _ = require('lodash');
const gulp = require('gulp');
const git = require('gulp-git');
const bump = require('gulp-bump');
const runSequence = require('run-sequence');
const tagVersion = require('gulp-tag-version');

const packagepath = './package.json';
const types = ['patch', 'prepatch', 'minor', 'preminor', 'major', 'premajor', 'prerelease'];

_.forEach(types, type => {
  gulp.task(`release:package:${type}`, updateVersion(type));
  gulp.task(`release:${type}`, () => runSequence(
    `release:package:${type}`,
    'build',
    'release:commit',
    'gh-pages',
    'release:tag'
  ));
});

gulp.task('release:tag', () => {
  return gulp.src(packagepath)
    .pipe(tagVersion());
});

gulp.task('release:commit', () => {
  const packagepath = path.resolve(__dirname, '../..', 'package.json');
  delete require.cache[packagepath];
  const { version } = require(packagepath);
  return gulp.src(['./dist/*', packagepath])
    .pipe(git.commit(version));
});

function updateVersion(type) {
  return () => {
    return gulp.src(packagepath)
        .pipe(bump({ type }))
        .pipe(gulp.dest('./'));
  };
}
