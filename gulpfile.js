'use strict';

const gulp = require('gulp'),
      del = require('del'),
      exec = require('child_process').execSync,
      uglify = require('gulp-uglify-es').default,
      merge = require('event-stream').merge,
      zip = require('gulp-zip');
const pkgInfo = require('./package.json');

gulp.task('clean', () => del(['build/']));

gulp.task('resolve:node-deps', () => exec('cd ./node && npm update'));

gulp.task('build', ['clean', 'resolve:node-deps'], () => {
    let copy = gulp.src(['package.json', 'node/node_modules/**/*', 'node/dependency.json'], {base: '.'}).pipe(gulp.dest('build'));
    let minify = gulp.src(['main.js', 'node/*.js'], {base: '.'})
                     .pipe(uglify())
                     .pipe(gulp.dest('build'));

    return merge(copy, minify).on('end', () =>
            gulp.src('build/**/*', {base: 'build'})
                .pipe(zip(`${pkgInfo.name}-${pkgInfo.version}.zip`))
                .pipe(gulp.dest('build/dist')));
});

gulp.task('default', ['build']);
