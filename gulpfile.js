'use strict';

/* eslint-disable indent, node/no-unpublished-require */
const del = require('del'),
      exec = require('child_process').exec,
      gulp = require('gulp'),
      merge = require('event-stream').merge,
      path = require('path'),
      uglify = require('gulp-uglify-es').default,
      zip = require('gulp-zip');

const pkgInfo = require('./package.json'),
      config = require('./gulpconf.json');
/* eslint-enable indent, node/no-unpublished-require */

gulp.task('clean', () => del(['dist/**/*']));

gulp.task('resolve:node-deps', () => exec('npm update', {cwd: path.join(__dirname, 'node')}));

gulp.task('build', ['clean', 'resolve:node-deps'], () => {
    const copy = gulp.src(config.resource.src, {base: '.'});
    const minify = gulp.src(config.code.src, {base: '.'}).pipe(uglify({ecma: 6}));

    return merge(copy, minify)
        .pipe(zip(`${pkgInfo.name}-${pkgInfo.version}.zip`))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['build']);
