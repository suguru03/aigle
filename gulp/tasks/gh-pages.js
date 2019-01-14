'use strict';

const path = require('path');

const gulp = require('gulp');
const git = require('gulp-git');

const Aigle = require('../../');

require('./jsdoc');

Aigle.promisifyAll(git);

let version;

gulp.task('gh-pages:version', async () => {
  const packagepath = path.resolve(__dirname, '../..', 'package.json');
  delete require.cache[packagepath];
  version = require(packagepath).version;
});

gulp.task('gh-pages:add', () => gulp.src('./docs/*').pipe(git.add({ args: '-f' })));

gulp.task('gh-pages:reset', () => git.reset('HEAD'));

gulp.task('gh-pages:stash', git.stash);

gulp.task('gh-pages:stash:drop', cb => git.stash({ args: 'drop' }, cb));

gulp.task('gh-pages:pop', cb => git.exec({ args: 'checkout stash -- .' }, cb));

gulp.task('gh-pages:commit', () =>
  gulp.src('./docs/*').pipe(
    git.commit(`docs(jsdoc): v${version} [ci skip]`, {
      args: '--no-verify',
      disableAppendPaths: true
    })
  )
);

gulp.task(
  'gh-pages',
  gulp.series(
    'jsdoc',
    'gh-pages:version',
    'gh-pages:add',
    'gh-pages:stash',
    'checkout:gh-pages',
    'gh-pages:pop',
    'gh-pages:reset',
    'gh-pages:add',
    'gh-pages:commit',
    'checkout:master',
    'gh-pages:stash:drop'
  )
);
