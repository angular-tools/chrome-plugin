var Page = new function () {
    this.init = function () {
        if (chrome && chrome.runtime) {
            chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
                if (message && (message._msg == 'getPage')) {
                    sendResponse(Page);
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


    this.sendMessageToPlugin = function (msgObj, cb) {
        chrome.runtime.sendMessage(msgObj, function (response) {
            cb(response);
        });
    };

    this.getPlugin = function (cb) {
        Page.sendMessageToPlugin({_msg: "getPlugin"}, cb);
    };

    this.init();
};