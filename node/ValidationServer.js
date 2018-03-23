/*eslint-env node, es6 */

(function () {
    'use strict';

    const spawn = require('child_process').spawn,
          dm = require('./DependencyManager');
    let server;

    /**
     * Run the html checking server.
     */
    function run() {
        dm.check().then(() => {
            server = spawn('java', ['-Xss1m', '-cp', dm.VALIDATOR_PATH, 'nu.validator.servlet.Main', '8888']);
        });
    }//run

    /**
     * Exit the html checking server.
     */
    function exit() {
        server.kill('SIGINT');
        server.stdin.end();
    }

    /**
     * Initializes the nu.validator domain with several management commands.
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
            'run',
            run,
            false,
            'Runs the validation server.'
        );

        domainManager.registerCommand(
            'nu.validator',
            'exit',
            exit,
            false,
            'Exits the validation server.'
        );
    }

    exports.init = init;
}());
