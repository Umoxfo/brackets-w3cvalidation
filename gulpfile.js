'use strict';

/* eslint-disable indent, node/no-unpublished-require */
const del = require('del'),
      exec = require('child_process').exec,
      gulp = require('gulp'),
//      merge = require('event-stream').merge,
      path = require('path'),
      uglify = require('gulp-uglify-es').default;
//      zip = require('gulp-zip');

//const pkgInfo = require('./package.json'),
//      config = require('./gulpconf.json');
const config = require('./gulpconf.json');
/* eslint-enable indent, node/no-unpublished-require */

gulp.task('clean', () => del(['dist/**/*']));

gulp.task('resolve:node-deps', () => exec('npm update', {cwd: path.join(__dirname, 'node')}));

gulp.task('copy', () => gulp.src(config.resource.src, {base: '.'}).pipe(gulp.dest('dist')));

gulp.task('minify', () => {
    return gulp.src(config.code.src, {base: '.'})
        .pipe(uglify({ecma: 6}))
        .pipe(gulp.dest('dist'));
});

/*
gulp.task('build', gulp.series(gulp.parallel('clean', 'resolve:node-deps'), () => {
    const copy = gulp.src(config.resource.src, {base: '.'});
    const minify = gulp.src(config.code.src, {base: '.'}).pipe(uglify({ecma: 6}));

    return merge(copy, minify)
        .pipe(zip(`${pkgInfo.name}-${pkgInfo.version}.zip`))
        .pipe(gulp.dest('dist'));
}));
*/

gulp.task('newbuild', gulp.series(gulp.parallel('clean', 'resolve:node-deps'), gulp.parallel('copy', 'minify')));

gulp.task('default', gulp.series('build'));
