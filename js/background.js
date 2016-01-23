var Plugin = new function () {
    this.data = {};
    /*
     Gets the popup window (Browser action)
     */
    this.getPopup = function () {
        var popups = chrome.extension.getViews({type: "popup"});

        return popups.length > 0 ? popups[0].Popup : null;
    };

    /*
     Get the current Page object (or injects creates a new Page object via content injection)

     @param {function} cb - callback function when Page is found
     @param {array} injections - list of scripts to inject into Page (first time only)

     */
    this.getPage = function (cb, injections) {
        Plugin._sendMessageToPage({_msg: 'getPage'}, function (response) {
            if (response === undefined) {
                Plugin.injectFilesInPage([].concat('src/common/page.js', 'src/page.js', injections || []), function (response) {
                    Plugin.getPage(cb);
                });
            } else {
                if (typeof(cb) !== 'undefined') {
                    cb(response);
                }
            }
        });
    };

    /*
     Get the current Page's HTML code

     @param {function} cb - callback function when Page HTML is found
     */
    this.getPageHTML = function (cb) {
        Plugin.queryPage('getHTML', cb);
    };

    /*
     Get the current Page's URL

     @param {function} cb - callback function when Page URL is found
     */
    this.getPageURL = function (cb) {
        Plugin.queryPage('getURL', cb);
    };

    this.queryPage = function (msg, cb) {
        Plugin.sendMessageToPage({_msg: msg}, cb);
    };

    /*
     Injects Javascript, CSS, or Code in Page.

     @param {array} list - Array of items like {file: .js|.css} or {code: <code>}
     @param {function} cb - callback function after everything has been executed
     @param {int} tabId - optional tabId (defaults to current tab)

     */
    this.injectAllInPage = function (list, callback, tabId) {
        var createCallback = function (tabId, injectDetails, innerCallback) {
            return function () {
                if (/\.css/.test(injectDetails['file'])) {
                    chrome.tabs.insertCSS(tabId, injectDetails, innerCallback);
                } else {
                    chrome.tabs.executeScript(tabId, injectDetails, function (result) {
                        if (chrome.runtime.lastError) { // or if (!result)
                            //console.log("error: ", chrome.runtime.lastError);
                        } else {
                            innerCallback(result);
                        }
                    });
                }
            };
        };

        for (var i = list.length - 1; i >= 0; --i) {
            callback = createCallback(tabId, list[i], callback);
        }

        if (callback !== null) {
            callback();   // execute outermost function
        }
    };

    /*
     List of files to inject in page (css or js)

     @param {array} files - Array of files to inject
     @param {function} cb - Callback function after all files are injected and executed
     */
    this.injectFilesInPage = function (files, cb) {
        var list = [];
        for (var i = 0; i < files.length; i++) {
            list.push({file: files[i]});
        }

        Plugin.injectAllInPage(list, cb);
    };

    /* Similar to injectFilesInPage */
    this.injectFileInPage = function (src, cb) {
        Plugin.injectFilesInPage([src]);
    };

    /* Injects JavaScript code in Page */
    this.injectCodeInPage = function (code, cb) {
        Plugin.injectAllInPage([{code: code}], cb);
    };

    this.sendMessageToPage = function (msgObj, cb, config) {
        Plugin.getPage(function () {
            Plugin._sendMessageToPage(msgObj, cb, config);
        });
    };
    /*
     Send messages from background page to active tab (or matching tabs)

     @param {object} msgObj - Object with message data
     @param {function} cb - Callback function to parse responses
     @param {object} config - Object to filter tabs


     @return void
     */
    this._sendMessageToPage = function (msgObj, cb, config) {
        chrome.tabs.query(config || {"status": "complete", "windowId": chrome.windows.WINDOW_ID_CURRENT, "active": true}, function (tabs) {
            for (var i = 0; i < tabs.length; i++) {
                (function (tab) {
                    //console.log("tab: ", tab);
                    chrome.tabs.sendMessage(tab, msgObj, function (response) {
                        if (typeof(cb) !== 'undefined') {
                            cb(response, tab);
                        }
                    });
                })(tabs[i].id);
            }
        });
    };

    /* Reserved */
    this.init = function () {
        if (typeof(chrome) !== 'undefined') {
            if (chrome.browserAction) {
                chrome.browserAction.onClicked.addListener(function (tab) {
                    //Note: This does not trigger if default_popup is set in manifest.json
                    if (typeof(onPopup) !== 'undefined') {
                        onPopup(tab);
                    }
                });
            }

            if (chrome.runtime) {
                chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
                    //console.log("message: ", message);
                    if (message && (message._msg == 'getPlugin')) {
                        sendResponse(Plugin);
                    } else if (typeof(onMessage) != 'undefined') {
                        onMessage(message, sender, sendResponse);
                    }
                });
            }
        }
    };

    /*
     Retrieves a key from local storage

     @param {string} key - The key
     @param {function} cb - Function to return saved value
     @param {function} func - Function to calculate value when none is found
     @param {boolean} fresh - Reset value with func's value

     */
    this.get = function (key, cb, func, fresh) {
        var setter = function () {
            Plugin.set(key, func ? func() : null, cb);
        };

        if (fresh) {
            setter();
        } else {
            chrome.storage.local.get(key, function (result) {
                if (func && (!result || typeof(result[key]) == 'undefined')) {
                    setter();
                } else {
                    cb(result[key]);
                }
            });
        }
    };

    /*
     Save a key to local storage

     @param {string} key - The key
     @param {function} cb - Function to return saved value
     */
    this.set = function (key, value, cb) {
        var obj = {};
        obj[key] = value;
        chrome.storage.local.set(obj, function () {cb(value)});
    };

    this.init();
};