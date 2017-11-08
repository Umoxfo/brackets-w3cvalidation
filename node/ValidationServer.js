/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, node: true */
/*global $, require */

(function () {
    'use strict';

    const exec = require('child_process').exec,
          vnu = require('vnu-jar');

    /**
     * @private
     * Handler function for the w3cvalidator.validate command.
     */
    function runServer() {
        exec(`java -Xss1m -cp ${vnu} nu.validator.servlet.Main 8888`);
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
            'runServer',
            runServer,
            false,
            'Runs the validation server in standalone.'
        );
    }

    exports.init = init;
}());
