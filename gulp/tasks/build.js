'use strict';

const fs = require('fs');
const { spawn } = require('child_process');

const gulp = require('gulp');

const Aigle = require('../../');

const builds = [
  ['browserify', './browser.js -s Promise', './dist/aigle.js'],
  ['babili', './dist/aigle.js', './dist/aigle.min.js'],
  ['buble', './dist/aigle.js', './dist/aigle-es5.js'],
  ['uglifyjs', '--compress --mangle -- ./dist/aigle-es5.js', './dist/aigle-es5.min.js']
];

gulp.task('build', () => {
  return Aigle.eachSeries(builds, ([command, args, output]) => {
    return new Aigle(resolve => {
      spawn(`./node_modules/.bin/${command}`, args.split(' '))
        .on('close', () => {
          console.log(`built: \x1b[32m${output}\x1b[0m`);
          resolve();
        })
        .stdout.pipe(fs.createWriteStream(output));
    });
  });
});
