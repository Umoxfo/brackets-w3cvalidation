/*
 * Copyright (c) Makoto Sakaguchi. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

'use strict';

{
    /* eslint-disable indent */
    const dm = require('./DependencyManager'),
          spawn = require('child_process').spawn;
    /* eslint-enable indent */
    let server;

    /**
     * Run the html checking server.
     * @param {function()} cb Callback will be called when the validation server is ready.
     */
    function run(cb) {
        dm.check().then(() => {
            server = spawn('java', ['-Xss1m', '-cp', `${dm.VALIDATOR_PATH}/vnu.jar`, 'nu.validator.servlet.Main', '8888']);

            server.stdout.on('data', data => {
                if (data.includes('Initialization complete.')) { cb(null, null); }
            });
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
            true,
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

    module.exports.init = init;
}
