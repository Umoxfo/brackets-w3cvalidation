/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global require, Promise */
/*eslint-env node, es6 */

'use strict';

const os = require('os'),
      path = require('path'),
      fs = require('fs'),
      promisify = require('util.promisify'),
      request = require('request'),
      crypto = require('crypto'),
      extract = require('extract-zip');

const URL = 'https://github.com/validator/validator/releases/download/17.11.1/vnu.jar_17.11.1.zip',
      HASH = '9051aebc6ea1474052d2a25e65dc58f12a8d5fda',
      LIB_PATH = path.join(__dirname, 'lib'),
      FILE_PATH = path.join(LIB_PATH, 'nu.validator/vnu.jar'),
      tmp = os.tmpdir();

/**
 * @const
 * @type {string}
 */
module.exports.JAR_PATH = FILE_PATH;

/**
 * @private
 * The timeout with Promise support.
 */
function sleep(time, callback) {
    return new Promise(resolve => setTimeout(resolve, time)).then(callback());
}//sleep

/**
 * @private
 * Download
 */
function download(url, output) {
    return new Promise((resolve, reject) => {
        request.get(url)
               .on('error', err => reject(err))
               .pipe(fs.createWriteStream(output))
               .on('finish', () => resolve('download'));
    });
}//download

/**
 * @private
 * Checksum by SHA-1
 */
function checksum(file, hash) {
    const sha1 = crypto.createHash('sha1');

    return new Promise((resolve, reject) => {
        fs.createReadStream(file)
          .on('data', data => sha1.update(data))
          .on('close', () => {
            if (sha1.digest('Hex') === hash) {
                resolve('hash check');
            } else {
                reject(new Error('Hash Error'));
            }//if-else
        });
    });
}//checksum

/**
 * @private
 * Decompress
 */
function decompress(file) {
    const options = {
        dir: LIB_PATH,
        onEntry: (entry) => {
            entry.fileName = entry.fileName.replace(/(\w+\/)/, 'nu.validator/')
        }//onEntry
    };

    return promisify(extract)(file, options);
}//decompress

/**
 * @private
 * Download the validation library
 */
function getLiblary() {
    const file = path.join(tmp, 'vnu.zip');

    return new Promise(resolve => {
        download(URL, file)
        .then(() => checksum(file, HASH))
        .then(() => decompress(file))
        .then(() => resolve('vnu'))
        .catch(() => {
            // If throws error, waiting at least one second and then re-download
            sleep((Math.random() + 1) * 1000, getLiblary);
        });
    });
}//getLiblary

/*
 * Check the vnu.jar file exist
 */
function check() {
    return new Promise(resolve => {
        promisify(fs.access)(FILE_PATH, fs.constants.R_OK)
        .then(() => checksum(FILE_PATH, HASH))
        .then(() => resolve())
        .catch(() => getLiblary().then(() => resolve()));
    });
}//check

module.exports.check = check;
