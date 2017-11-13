/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*eslint-env node, es6, jquery */
/*global $, require, Promise */

'use strict';

const os = require('os'),
      path = require('path'),
      fs = require('fs'),
      request = require('request'),
      crypto = require('crypto'),
      extract = require('extract-zip');

const URL = "https://github.com/validator/validator/releases/download/17.11.1/vnu.jar_17.11.1.zip",
      HASH = '9051aebc6ea1474052d2a25e65dc58f12a8d5fda',
      FILE_PATH = 'lib/nu.validator/vnu.jar',
      dest = path.resolve(os.tmpdir(), 'vnu.zip');

/**
 * @private
 * The timeout with Promise support.
 */
function sleep(time, func) {
    return new Promise((resolve, reject) => setTimeout(() => resolve(), time)).then(func());
}//sleep

/**
 * @private
 * Download library
 */
function getLiblary() {
    new Promise((resolve, reject) => { // Download
        request(URL).pipe(fs.createWriteStream(dest)).on('finish', () => resolve('download'));
    }).then(msg => {
        new Promise((resolve, reject) => { // Checksum
            const sha1 = crypto.createHash('sha1');

            fs.createReadStream(dest)
              .on('data', data => sha1.update(data))
              .on('close', () => {
                if (sha1.digest('Hex') !== HASH) return reject('hash');

                resolve('checksum');
            });
        });
    }).then(msg => {
        const options = {
            dir: path.resolve('lib'),
            onEntry: (entry, zipfile) => {
                entry.fileName = entry.fileName.replace(/(\w+\/)/, 'nu.validator/')
            }//onEntry
        };

        extract(dest, options, err => {
            if (err) throw err;

            return 'decompress';
        });
    }).catch(err => {
        if (err === 'hash') {
            sleep(1000, getLiblary());
        } else {
            console.error(err);
        }//if-else
    });
}//getLiblary

/*
 * Check the vnu.jar file exist
 */
fs.access(FILE_PATH, fs.constants.R_OK | fs.constants.W_OK, err => { if(err) getLiblary(); });
