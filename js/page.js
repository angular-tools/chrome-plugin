var Page = new function () {
    /**
     * Send message to background script
     *
     * @param {object} msgObj - Message object to pass
     * @param {function} cb - response function
     */
    this.sendMessageToPlugin = function (msgObj, cb) {
        chrome.runtime.sendMessage(msgObj, function (response) {
            cb(response);
        });
    };

    /**
     * Get background page object
     *
     * @param {function} cb - function to return Plugin object
     */

    this.getPlugin = function (cb) {
        Page.sendMessageToPlugin({_msg: "getPlugin"}, cb);
    };

    /**
     * Init function
     *
     * @private
     */

    this._init = function () {
        if (chrome && chrome.runtime) {
            chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
                if (message && (message._msg == 'getPage')) {
                    sendResponse(Page);
                } else if (message && (message._msg == 'getSelection')) {
                    var sel = window.getSelection();
                    var html = '';

                    if (sel.rangeCount) {
                        var container = document.createElement("div");
                        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                            container.appendChild(sel.getRangeAt(i).cloneContents());
                        }

                        html = container.innerHTML;
                    }

                    sendResponse(html);
                } else if (message && (message._msg == 'getHTML')) {
                    sendResponse(window.document.documentElement.outerHTML);
                } else if (message && (message._msg == 'getURL')) {
                    sendResponse(window.location.href);
                } else if (typeof(onMessage) != 'undefined') {
                    onMessage(message, sender, sendResponse);
                }
            });
        }
    };

    this._init();
};