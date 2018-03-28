/*
 * Copyright (c) Makoto Sakaguchi. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

'use strict';

require('request');

/* eslint-disable indent */
const crypto = require('crypto'),
      execFile = require('child_process').execFile,
      fs = require('fs'),
      checkJRE = require('./JRE').checkJRE,
      JSZip = require('jszip'),
      mkdirp = require('mkdirp2'),
      path = require('path'),
      promisify = require('util.promisify'),
      rp = require('request-promise-native');
/* eslint-enable indent */

const VNU = require('./dependency.json').VNU;

const VALIDATOR_HOME = path.join(__dirname, 'lib', 'nu.validator');

/**
 * @const
 * @type {string} path to the vnu.jar file
 */
module.exports.VALIDATOR_PATH = VALIDATOR_HOME;

/**
 * @private
 * Decompress the zip file
 */
function decompress(data) {
    return mkdirp.promise(VALIDATOR_HOME)
        .then(() => JSZip.loadAsync(data, {checkCRC32: true}))
        .then(zip => {
            const filenames = Object.keys(zip.files).filter(k => k != 'dist/');

            return Promise.all(filenames.map(i => new Promise((resolve, reject) => {
                const relativePath = path.join(VALIDATOR_HOME, i.replace(/.*?\//, ''));
                zip.files[i].nodeStream()
                    .pipe(fs.createWriteStream(relativePath))
                    .on('finish', () => resolve())
                    .on('error', err => reject(err));
            })));
        });
}//decompress

/**
 * @private
 * Downloads the Nu Html Checker, the validation library.
 */
function getLiblary() {
    const options = {
        url: `https://github.com/validator/validator/releases/download/${VNU.version}/vnu.jar_${VNU.version}.zip`,
        encoding: null
    };
    const sha1 = crypto.createHash('sha1');

    return rp.get(options)
        .on('data', chunk => sha1.update(chunk))
        .then(body => Promise.all([
            new Promise((resolve, reject) => {
                (sha1.digest('Hex') === VNU.hash) ? resolve() : reject();
            }),
            decompress(body)
        ])).catch(() => {
            // If throws error, waiting at least one second and then re-download
            promisify(setTimeout)((Math.random() + 1) * 1000).then(() => getLiblary());
        });
}//getLiblary

/**
 * @private
 * Check the Nu Html Checker library
 */
function checkHtmlValidator() {
    return promisify(execFile)('java', ['-jar', `${VALIDATOR_HOME}/vnu.jar`, '--version'])
        .then(output => new Promise((resolve, reject) => {
            (output.trim() >= VNU.version) ? resolve() : reject();
        })).catch(() => getLiblary());
}//checkHtmlValidator

/**
 * Check the validator library and requires
 */
function check() {
    return checkJRE().then(() => checkHtmlValidator());
}//check

module.exports.check = check;
