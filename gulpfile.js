'use strict';

const gulp = require('gulp'),
      composer = require('gulp-uglify/composer'),
      zip = require('gulp-zip');
const del = require('del'),
      exec = require('child_process').execSync,
      uglifyes = require('uglify-es'),
      merge = require('event-stream').merge;
const pkgInfo = require('./package.json'),
      uglify = composer(uglifyes, console);

gulp.task('clean', () => del(['build/']));

gulp.task('resolve:node-deps', () => exec('cd ./node && npm install && npm update'));

gulp.task('build', ['clean', 'resolve:node-deps'], () => {
    let copy = gulp.src(['package.json', 'node/node_modules/**/*'], {base: '.'}).pipe(gulp.dest('build'));
    let minify = gulp.src(['main.js', 'node/*.js'], {base: '.'})
                     .pipe(uglify({}))
                     .pipe(gulp.dest('build'));

    return merge(copy, minify).on('end', () =>
            gulp.src('build/**/*', {base: 'build'})
                .pipe(zip(`${pkgInfo.name}-${pkgInfo.version}.zip`))
                .pipe(gulp.dest('build/dist')));
});

gulp.task('default', ['build']);
