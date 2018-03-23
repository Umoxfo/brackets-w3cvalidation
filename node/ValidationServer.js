/*eslint-env node, es6 */

(function () {
    'use strict';

    const execFile = require('child_process').execFile,
          dm = require('./DependencyManager');

    /**
     * Handler function for the w3cvalidator.validate command.
     */
    function run() {
        dm.check().then(() => execFile('java', ['-Xss1m', '-cp', dm.VALIDATOR_PATH, 'nu.validator.servlet.Main', '8888']));
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
