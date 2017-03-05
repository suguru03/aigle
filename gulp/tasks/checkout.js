'use strict';

const gulp = require('gulp');
const git = require('gulp-git');

const Aigle = require('../../');

Aigle.promisifyAll(git);

gulp.task('checkout:master', () => git.checkoutAsync('master', { args: '-f' }));

gulp.task('checkout:gh-pages', () => git.checkoutAsync('gh-pages'));
