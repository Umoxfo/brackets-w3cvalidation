'use strict';

/* eslint-disable indent, node/no-unpublished-require */
const exec = require('child_process').exec,
      path = require('path'),
      del = require('del'),
      gulp = require('gulp'),
      uglify = require('gulp-uglify-es').default,
      merge2 = require('merge2'),
      filter = require('gulp-filter'),
      zip = require('gulp-vinyl-zip').zip;

const pkgInfo = require('./package.json'),
      config = require('./gulpconf.json'),
      srcFilter = filter(config.code.src, {restore: true});
/* eslint-enable indent, node/no-unpublished-require */

gulp.task('clean', () => del(['dist/**/*']));

gulp.task('update-deps', () => exec('npm update', {cwd: path.join(__dirname, 'node')}));

gulp.task('compile', gulp.series(gulp.parallel('clean', 'update-deps'), () => {
    return gulp.src(config.dist.src, {base: '.'})
        .pipe(srcFilter)
        .pipe(uglify({ecma: 6}))
        .pipe(srcFilter.restore)
        .pipe(zip(`${pkgInfo.name}-${pkgInfo.version}.zip`))
        .pipe(gulp.dest('dist'));
}));

gulp.task('build', gulp.series(gulp.parallel('clean', 'update-deps'), () => {
    return merge2(gulp.src(config.code.src, {base: '.'}).pipe(uglify({ecma: 6})),
                  gulp.src(config.resource.src, {base: '.'})) // eslint-disable-line indent
        .pipe(zip(`${pkgInfo.name}-${pkgInfo.version}.zip`))
        .pipe(gulp.dest('dist'));
}));

gulp.task('default', gulp.series('build'));
