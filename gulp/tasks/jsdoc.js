'use strict';

const { exec } = require('child_process');

const gulp = require('gulp');

gulp.task('jsdoc', () => exec('./node_modules/.bin/jsdoc ./lib -c ./gulp/jsdoc.json'));
