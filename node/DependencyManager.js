/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global require, Promise */
/*eslint-env node, es6 */

'use strict';

const path = require('path'),
      fs = require('fs'),
      execFile = require('child_process').execFile,
      promisify = require('util.promisify'),
      request = require('request'),
      rp = require('request-promise-native'),
      crypto = require('crypto'),
      JSZip = require('jszip'),
      mkdirp = require('mkdirp2');

const VNU_VERSION = '17.11.1',
      URL = `https://github.com/validator/validator/releases/download/${VNU_VERSION}/vnu.jar_${VNU_VERSION}.zip`,
      HASH = '9051aebc6ea1474052d2a25e65dc58f12a8d5fda';

const LIB_PATH = path.join(__dirname, 'lib'),
      FILE_PATH = path.join(LIB_PATH, 'nu.validator', 'vnu.jar');

/**
 * @const
 * @type {string} path to the vnu.jar file
 */
module.exports.VALIDATOR_PATH = FILE_PATH;

/**
 * @private
 * The timeout with Promise support.
 */
function sleep(time, callback) {
    return promisify(setTimeout)(time).then(() => callback());
}//sleep

/**
 * @private
 * Decompress
 */
function decompress(data) {
    return JSZip.loadAsync(data, {
        checkCRC32: true
    }).then(zip => {
        const dir = path.join(LIB_PATH, 'nu.validator'),
              filenames = Object.keys(zip.files).filter(k => k != 'dist/');

        return mkdirp.promise(dir).then(() => {
            return Promise.all(filenames.map(i => {
                return new Promise((resolve, reject) => {
                    const relativePath = path.join(dir, i.replace(/.*?\//, ''));
                    zip.files[i].nodeStream()
                       .pipe(fs.createWriteStream(relativePath))
                       .on('finish', () => resolve())
                       .on('error', err => reject(err));
                });
            }));
        });
    });
}//decompress

/**
 * @private
 * Downloads the Nu Html Checker, the validation library.
 */
function getLiblary() {
    const options = {
        url: URL,
        encoding: null
    };
    const sha1 = crypto.createHash('sha1');

    return rp.get(options)
    .on('data', chunk => sha1.update(chunk))
    .then(body => {
        return Promise.all([
            new Promise((resolve, reject) => {
                if (sha1.digest('Hex') === HASH) {
                    resolve('download');
                } else {
                    reject(new Error('Hash Error'));
                }
            }),
            decompress(body)
        ]);
    }).then(() => 'vnu')
    .catch(() => {
        // If throws error, waiting at least one second and then re-download
        sleep((Math.random() + 1) * 1000, getLiblary);
    });
}//getLiblary

/**
 * @private
 * vnu.jar version
 */
function getVersion() {
    return promisify(execFile)('java', ['-jar', FILE_PATH, '--version'])
    .then(output => {
        return new Promise((resolve, reject) => {
            if (output.trim() == VNU_VERSION) {
                resolve('latest version');
            } else {
                reject('old version');
            }//if-else
        });
    });
}//getVersion

/*
 * Check the vnu.jar file exist
 */
function check() {
    return promisify(fs.access)(FILE_PATH, fs.constants.R_OK)
        .then(() => getVersion())
        .catch(() => getLiblary());
}//check

module.exports.check = check;
