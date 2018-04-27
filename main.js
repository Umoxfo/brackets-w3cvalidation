/*
 * Copyright (c) Makoto Sakaguchi. All rights reserved.
 * Licensed under the MIT License. See LICENSE in the project root for license information.
 */

/* global brackets */
/* eslint-env amd, es6, jquery */

'use strict';

define((require, exports, module) => {
    /* eslint-disable indent */
    const AppInit = brackets.getModule('utils/AppInit'),
          CodeInspection = brackets.getModule('language/CodeInspection'),
          CommandManager = brackets.getModule('command/CommandManager'),
          DocumentManager = brackets.getModule('document/DocumentManager'),
          ExtensionManager = brackets.getModule('extensibility/ExtensionManager'),
          ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
          Menus = brackets.getModule('command/Menus'),
          NodeDomain = brackets.getModule('utils/NodeDomain');

    const nuValidatorSever = new NodeDomain('nu.validator', ExtensionUtils.getModulePath(module, 'node/ValidationServer'));

    const COMMAND_ID = 'nu.validator.refresh',
          PROVIDER_ID = 'nu.validator';
    /* eslint-enable indent */

    //var Strings = require("strings");

    // Validation request
    const request = {
        url: 'http://localhost:8888/?out=json',
        type: 'POST',
        contentType: 'text/html; charset=utf-8',
        data: '',
        cache: false,
        processData: false
    };

    /**
     * Validation handler as a client
     */
    function validationCheck(text) {
        /* eslint-disable indent */
        const response = new $.Deferred(),
              result = {errors: []};
        /* eslint-enable indent */

        request.data = text;

        $.ajax(request).done(data => {
            data.messages.forEach(item => {
                let type;
                switch (item.type) {
                    case 'info':
                        type = CodeInspection.Type.WARNING;
                        break;
                    case 'error':
                        type = CodeInspection.Type.ERROR;
                        break;
                } //switch

                result.errors.push({
                    pos: {
                        line: (item.firstLine ? item.firstLine : item.lastLine) - 1,
                        ch: item.firstColumn
                    },
                    endPos: {
                        line: item.lastLine - 1,
                        ch: item.lastColumn
                    },
                    message: item.message,
                    type
                });
            });

            response.resolve(result);
        }).fail(() => {
            new Promise(resolve => setTimeout(resolve, (Math.random() + 1) * 1000)).then(() => validationCheck(text));
        });

        return response.promise();
    }//validationCheck

    /**
     * Lunch a validation server and register the HTML code inspection
     */
    function validationService() {
        nuValidatorSever.exec('run').done(() => {
            // Register the HTML Linting
            AppInit.appReady(() => {
                CodeInspection.register('html', {
                    name: PROVIDER_ID,
                    scanFileAsync: validationCheck
                });

                // Stop the server when status changed (ex. remove, update, etc.)
                ExtensionManager.on('statusChange', (_, extensionID) => {
                    if (extensionID === 'umoxfo.w3cvalidation') {
                        nuValidatorSever.exec('exit');
                    }
                });
            });
        });
    }//validationService

    // Send a file saved event
    function refreshValidation() {
        DocumentManager.getCurrentDocument().notifySaved();
    }//refreshValidation

    // Command
    CommandManager.register('Refresh W3C validation', COMMAND_ID, refreshValidation);
    //CommandManager.register(Strings.REFRESH_W3C_VALIDATION, COMMAND_ID, refreshValidation);

    // Menu
    Menus.getMenu(Menus.AppMenuBar.EDIT_MENU).addMenuItem(COMMAND_ID, 'F9');

    // Server launcher when the extension is loaded
    validationService();
});
