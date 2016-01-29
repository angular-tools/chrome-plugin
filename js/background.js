var Plugin = new function () {
    this.data = {};

    /**
     * Gets the popup window (Browser action)
     * @returns {null}
     */
    this.getPopup = function () {
        var popups = chrome.extension.getViews({type: "popup"});

        return popups.length > 0 ? popups[0].Popup : null;
    };

    /**
     * Get the current Page object (or injects creates a new Page object via content injection)
     *
     * @param {function} cb - callback function when Page is found
     * @param {list} injections - list of scripts to inject into Page (first time only)
     */
    this.getPage = function (cb, injections) {
        Plugin._sendMessageToPage({_msg: 'getPage'}, function (response) {
            if (response === undefined) {
                Plugin.injectFilesInPage([].concat('/src/bower_components/chrome-plugin/js/page.js', '/src/js/page.js', injections || []), function (response) {
                    Plugin.getPage(cb);
                });
            } else {
                if (typeof(cb) !== 'undefined') {
                    cb(response);
                }
            }
        });
    };

    /**
     * Get the current Page's selection HTML code
     *
     * @param {function} cb - callback function when Page selection HTML is found
     */
    this.getPageSelectedHTML = function (cb) {
        Plugin.queryPage('getSelection', cb);
    };

    /**
     * Get the current Page's HTML code
     *
     * @param {function} cb - callback function when Page HTML is found
     */
    this.getPageHTML = function (cb) {
        Plugin.queryPage('getHTML', cb);
    };

    /**
     * Get the current Page's URL
     *
     * @param {function} cb - callback function when Page URL is found
     */
    this.getPageURL = function (cb) {
        Plugin.queryPage('getURL', cb);
    };

    /**
     * For internal communication to pages
     *
     * @param {string} msg - message to send
     * @param {function} cb - response function
     */
    this.queryPage = function (msg, cb) {
        Plugin.sendMessageToPage({_msg: msg}, cb);
    };

    /**
     * Injects Javascript, CSS, or Code in Page.
     *
     * @param {list} list - Array of items like {file: .js|.css} or {code: <code>}
     * @param {function} callback - callback function after everything has been executed
     * @param {int} tabId - optional tabId (defaults to current tab)
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

    /**
     * List of files to inject in page (css or js)
     * @param {list} files - Array of files to inject
     * @param {function} cb - Callback function after all files are injected and executed
     */
    this.injectFilesInPage = function (files, cb) {
        var list = [];
        for (var i = 0; i < files.length; i++) {
            list.push({file: files[i]});
        }

        Plugin.injectAllInPage(list, cb);
    };

    /**
     *  Similar to injectFilesInPage
     * @param {string} src
     * @param {function} cb
     */
    this.injectFileInPage = function (src, cb) {
        Plugin.injectFilesInPage([src]);
    };

    /**
     * Injects JavaScript code in Page
     *
     * @param {string} code
     * @param {function} cb
     */
    this.injectCodeInPage = function (code, cb) {
        Plugin.injectAllInPage([{code: code}], cb);
    };

    /**
     * Send message to page (makes sure Page object has been injected)
     *
     * @param {object} msgObj - Object with message data
     * @param {function} cb - Callback function to parse responses
     * @param {object} config - Object to filter tabs
     */
    this.sendMessageToPage = function (msgObj, cb, config) {
        Plugin.getPage(function () {
            Plugin._sendMessageToPage(msgObj, cb, config);
        });
    };

    /**
     * Send messages from background page to active tab (or matching tabs)
     * @param {object} msgObj - Object with message data
     * @param {function} cb - Callback function to parse responses
     * @param {object} config - Object to filter tabs
     * @private
     */
    this._sendMessageToPage = function (msgObj, cb, config) {
        chrome.tabs.query(config || {"windowId": chrome.windows.WINDOW_ID_CURRENT, "active": true}, function (tabs) {
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

    /**
     * Retrieves a key from local storage
     *
     * @param {string} key - The key
     * @param {function} cb - Function to return saved value
     * @param {function|object} defaults - default value when none is found (closure allowed)
     * @param {boolean} fresh - Reset value with func's value
     */
    this.get = function (key, cb, defaults, fresh) {
        var setter = function () {
            Plugin.set(key, typeof(defaults) == 'function' ? defaults() : defaults, cb);
        };

        if (fresh) {
            setter();
        } else {
            chrome.storage.local.get(key, function (result) {
                if (defaults && (!result || typeof(result[key]) == 'undefined')) {
                    setter();
                } else {
                    cb(result[key]);
                }
            });
        }
    };

    /**
     * Save a key to local storage
     *
     * @param {string} key - The key
     * @param value
     * @param {function} cb - Function to return saved value
     */
    this.set = function (key, value, cb) {
        var obj = {};
        obj[key] = value;

        chrome.storage.local.set(obj, function () {
            if (cb) {
                cb(value);
            }
        });
    };

    /**
     * Global data shared between background page and popup (closing popup does not delete data)
     * (Popup also sets a _refresh function internally)
     *
     * @param {string} key
     * @param {object} value
     */
    this.setData = function (key, value) {
        Plugin.data[key] = value;
        Plugin.set('data', Plugin.data);

        if (typeof(Plugin._refresh) == 'function') {
            Plugin._refresh();
        }
    };


    /**
     * Call a function
     * Plugin._call(func, arg1, arg2, arg3, ...)
     *
     * @private
     */
    this._call = function (func) {
        if (arguments.length > 0) {
            var args = Array.prototype.slice.call(arguments, 1);

            if (typeof(func) == 'function') {
                func.call(Plugin, args);
            }
        }
    };

    /**
     * Init function
     *
     * @private
     */
    this._init = function () {
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
                    if (message && (message._msg == 'getPlugin')) {
                        sendResponse(Plugin);
                    } else if (typeof(onMessage) != 'undefined') {
                        onMessage(message, sender, sendResponse);
                    }
                });
            }
        }
    };

    this._init();
};