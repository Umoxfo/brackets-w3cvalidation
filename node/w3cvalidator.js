/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global */

(function () {
    'use strict';

    const exec = require('child_process').execSync,
          vnu = require('vnu-jar');

    /**
     * @private
     * Handler function for the w3cvalidator.validate command.
     * @param {string} the file path for verification
     * @return {string} the validation report
     */
    function validate(path) {
        exec(`java -Xss2m -jar ${vnu} --format text --skip-non-html ${path}`, (error, stdout, stderr) => {
            console.log('stdout: ' + stdout);
            console.log('stderror: ' + stderr);

            return stderr;
        });
    }

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain('w3cvalidator')) {
            domainManager.registerDomain('w3cvalidator', {
                major: 0,
                minor: 1
            });
        }

        domainManager.registerCommand(
            'w3cvalidator',
            'validate',
            validate,
            true,
            'Returns the validation report of a file', [{
                name: 'path',
                type: 'string',
                description: 'the file path for verification'
            }], [{
                name: 'report',
                type: 'string',
                description: 'validation report in JSON format'
            }]
        );
    }

    exports.init = init;
}());
