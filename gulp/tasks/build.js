'use strict';

const fs = require('fs');
const { spawn, exec } = require('child_process');

const gulp = require('gulp');

const Aigle = require('../../');

const builds = [
  ['browserify', './browser.js -s Promise', './dist/aigle.js'],
  ['babili', './dist/aigle.js', './dist/aigle.min.js'],
  ['buble', './dist/aigle.js', './dist/aigle-es5.js'],
  ['uglifyjs', '--compress --mangle -- ./dist/aigle-es5.js', './dist/aigle-es5.min.js'],
];

gulp.task('build', () => {
  return Aigle.eachSeries(builds, ([command, args, output]) => {
    return new Aigle((resolve, reject) => {
      const child = spawn(`./node_modules/.bin/${command}`, args.split(' '));

      child.on('close', (code) => {
        if (code === 0) {
          console.log(`build success: \x1b[32m${output}\x1b[0m`);
          resolve();
        } else {
          console.log(`build failed: \x1b[31m${output}\x1b[0m`);
          reject();
        }
      });

      child.stdout.pipe(fs.createWriteStream(output));
      child.stderr.on('data', (data) => console.log(data.toString()));
    });
  });
});

gulp.task('build:type', () => Aigle.promisify(exec)('npm run build:type'));
