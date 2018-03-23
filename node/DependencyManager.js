/*eslint-env node, es6 */

{
    'use strict';

    require('request');
    const rp = require('request-promise-native');

    const path = require('path'),
          fs = require('fs'),
          promisify = require('util.promisify'),
          execFile = require('child_process').execFile,
          crypto = require('crypto'),
          JSZip = require('jszip'),
          mkdirp = require('mkdirp2');

    const VNU = require('./dependency.json').VNU;

    const LIB_PATH = path.join(__dirname, 'lib'),
          FILE_PATH = path.join(LIB_PATH, 'nu.validator', 'vnu.jar');

    /**
     * @const
     * @type {string} path to the vnu.jar file
     */
    exports.VALIDATOR_PATH = FILE_PATH;

    /**
     * @private
     * Decompress the zip file
     */
    function decompress(data) {
        const dir = path.join(LIB_PATH, 'nu.validator');

        return mkdirp.promise(dir)
        .then(() => JSZip.loadAsync(data, {checkCRC32: true}))
        .then(zip => {
            const filenames = Object.keys(zip.files).filter(k => k != 'dist/');

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
        .then(body => {
            return Promise.all([
                new Promise((resolve, reject) => {
                    if (sha1.digest('Hex') === VNU.hash) {
                        resolve('download');
                    } else {
                        reject('Hash Error');
                    }
                }),
                decompress(body)
            ]);
        }).catch(() => {
            // If throws error, waiting at least one second and then re-download
            promisify(setTimeout)((Math.random() + 1) * 1000).then(() => getLiblary());
        });
    }//getLiblary

    /**
     * @private
     * Check Java Rantime Engine
     */
    function checkJRE() {
        return new Promise((resolve, reject) => {
            execFile('java', ['-version'], (error, stdout, stderr) => {
                const currentVersion = stderr.substring(14, stderr.lastIndexOf('"'));

                (currentVersion < JAVA_VERSION) ? reject() : resolve();
            });
        }).catch(() => require('./JRE').install());
    }//checkJRE

    /**
     * @private
     * Check the Nu Html Checker library
     */
    function checkHtmlValidator() {
        return promisify(fs.access)(FILE_PATH, fs.constants.R_OK)
        .then(() => promisify(execFile)('java', ['-jar', FILE_PATH, '--version']))
        .then(output => {
            return new Promise((resolve, reject) => {
                (output.trim() < VNU.version) ? reject() : resolve();
            });
        }).catch(() => getLiblary());
    }//checkHtmlValidator

    /**
     * Check the validator library and requires
     */
    function check() {
        return checkJRE().then(() => checkHtmlValidator());
    }//check

    exports.check = check;
}
