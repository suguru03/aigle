'use strict';

const fs = require('fs');
const { exec } = require('child_process');

const gulp = require('gulp');

const Aigle = require('../../');

const builds = [
  ['browserify', './browser.js -s Promise',                    './dist/aigle.js'        ],
  ['babili',     './dist/aigle.js',                            './dist/aigle.min.js'    ],
  ['buble',      './dist/aigle.js',                            './dist/aigle-es5.js'    ],
  ['uglifyjs',   '--compress --mangle -- ./dist/aigle-es5.js', './dist/aigle-es5.min.js']
];

gulp.task('build', () => {
  return Aigle.eachSeries(builds, ([command, args, output]) => {
    return new Aigle(resolve => {
      exec(`./node_modules/.bin/${command} ${args}`)
        .stdout
        .on('end', () => {
          console.log(`built: \x1b[32m${output}\x1b[0m`);
          resolve();
        })
        .pipe(fs.createWriteStream(output));
    });
  });
});
