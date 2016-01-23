var Popup = new function () {
    this.getPlugin = function () {
        return chrome.extension.getBackgroundPage().Plugin;
    };

    this.getPage = function (cb) {
        Popup.getPlugin().getPage(cb);
    };

    this.setIcon = function (obj) {
        chrome.browserAction.setIcon(typeof(obj) == 'string' ? {path: "icons/save.png"} : obj);
    };

    this.setTitle = function (obj) {
        chrome.browserAction.setTitle(typeof(obj) == 'string' ? {title: obj} : obj);
    };

    this.setText = function (obj) {
        chrome.browserAction.setBadgeText(typeof(obj) == 'string' ? {text: obj} : obj);
    };
};