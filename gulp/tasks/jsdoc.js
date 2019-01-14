'use strict';

const { exec } = require('child_process');

const gulp = require('gulp');

const Aigle = require('../../');

gulp.task('jsdoc', () =>
  Aigle.promisify(exec)('./node_modules/.bin/jsdoc ./lib -c ./gulp/jsdoc.json')
);
