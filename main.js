/*global define, brackets */
/*eslint-env node, es6, jquery */

define(function (require, exports, module) {
    'use strict';

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

    //var Strings = require("strings");

    /**
     * Validation handler as a client
     */
    function handleValidation(text) {
        let response = $.Deferred(),
            result = { errors: [] };

        const request = {
            url: "http://localhost:8888/?out=json",
            type: 'POST',
            contentType: 'text/html; charset=utf-8',
            data: text,
            cache: false,
            processData: false
        };

        Promise.resolve($.ajax(request)).then(data => {
            let messages = data.messages;

            if (messages.length) {
                messages.forEach(item => {
                    let type;
                    switch (item.type) {
                        case 'warning':
                            type = CodeInspection.Type.WARNING;
                            break;
                        case 'error':
                            type = CodeInspection.Type.ERROR;
                            break;
                    }//switch

                    result.errors.push({
                        pos: {
                            line: item.lastLine - 1,
                            ch: 0
                        },
                        message: item.message,
                        type: type
                    });
                });
            }//if

            response.resolve(result);
        }).catch(() => {
            new Promise(resolve => {
                setTimeout(resolve, (Math.random() + 1) * 1000);
            }).then(() => handleValidation(text));
        });

        return response.promise();
    }//handleValidation

    // Listen a file saved event
    function refreshValidation() {
        DocumentManager.getCurrentDocument().notifySaved();
    }//refreshValidation

    /**
     * Validation Server launcher in standalone and
     * register the HTML code inspection
     */
    function validationService() {
        nuValidatorSever.exec('run').done(() => {
            // Register the HTML Linting
            AppInit.appReady(() => {
                CodeInspection.register('html', {
                    name: PROVIDER_ID,
                    scanFileAsync: handleValidation
                });

                // Stop the server before remove the extension.
                ExtensionManager.on('statusChange', () => {
                    if (ExtensionManager.isMarkedForRemoval('umoxfo.w3cvalidation')) {
                        nuValidatorSever.exec('exit');
                    }
                });
            });
        });
    }//validationService

    // Command
    //CommandManager.register(Strings.REFRESH_W3C_VALIDATION, COMMAND_ID, _refreshValidation);
    CommandManager.register('Refresh W3C validation', COMMAND_ID, refreshValidation);

    // Menu
    const editMenu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    editMenu.addMenuItem(COMMAND_ID, 'F9');

    // Server launcher when extension is loaded
    validationService();
});
