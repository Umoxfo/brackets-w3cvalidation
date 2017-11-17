/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global $, require */
/*eslint-env node, es6, jquery */

(function () {
    'use strict';

    const execFile = require('child_process').execFile,
          dm = require('./DependencyManager'),
          vnu = dm.JAR_PATH;

    /**
     * Handler function for the w3cvalidator.validate command.
     */
    function run() {
        dm.check().then(() => {
            console.info('run');
            execFile('java', ['-Xss1m', '-cp', vnu, 'nu.validator.servlet.Main', '8888']);
        });
    }//run

    /**
     * Initializes the test domain with several test commands.
     * @param {DomainManager} domainManager The DomainManager for the server
     */
    function init(domainManager) {
        if (!domainManager.hasDomain('nu.validator')) {
            domainManager.registerDomain('nu.validator', {
                major: 0,
                minor: 1
            });
        }

        domainManager.registerCommand(
            'nu.validator',
            'runServer',
            run,
            false,
            'Runs the validation server in standalone.'
        );
    }

    exports.init = init;
}());
