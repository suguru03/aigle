'use strict';

const { exec } = require('child_process');

const gulp = require('gulp');

gulp.task('jsdoc', done => exec('./node_modules/.bin/jsdoc ./lib -c ./gulp/jsdoc.json', done));
