'use strict';

const path = require('path');

const gulp = require('gulp');
const git = require('gulp-git');
const runSequence = require('run-sequence');

const Aigle = require('../../');

Aigle.promisifyAll(git);

let version;

gulp.task('gh-pages', () => runSequence(
  'jsdoc',
  'gh-pages:version',
  'gh-pages:add',
  'gh-pages:stash',
  'checkout:gh-pages',
  'gh-pages:pop',
  'gh-pages:commit',
  'checkout:master'
));

gulp.task('gh-pages:version', () => {
  const packagepath = path.resolve(__dirname, '../..', 'package.json');
  delete require.cache[packagepath];
  version = require(packagepath).version;
});

gulp.task('gh-pages:add', () => {
  return gulp.src('./docs/*')
    .pipe(git.add({ args: '-f' }));
});

gulp.task('gh-pages:stash', git.stash);

gulp.task('gh-pages:pop', () => git.execAsync({ args: 'checkout stash -- .' }));


gulp.task('gh-pages:commit', () => {
  return gulp.src('./docs/*')
    .pipe(git.commit(`docs(jsdoc): v${version} [ci skip]`));
});
