var Popup = new function () {
    /**
     * Get the Plugin object (from background script)
     *
     * @returns {Plugin}
     */
    this.getPlugin = function () {
        return chrome.extension.getBackgroundPage().Plugin;
    };

    /**
     * Get the DOM object
     * @param {function} cb - callback function with Page Object
     */
    this.getPage = function (cb) {
        Popup.getPlugin().getPage(cb);
    };

    /**
     * Change popup icon
     * @param {object|string} obj - path of icon file (png)
     */
    this.setIcon = function (obj) {
        chrome.browserAction.setIcon(typeof(obj) == 'string' ? {path: obj} : obj);
    };

    /**
     * Change the hover text for popup icon
     *
     * @param {string|object} obj
     */
    this.setTitle = function (obj) {
        chrome.browserAction.setTitle(typeof(obj) == 'string' ? {title: obj} : obj);
    };

    /**
     * Set badge text
     * @param {string|object} obj
     */
    this.setText = function (obj) {
        chrome.browserAction.setBadgeText(typeof(obj) == 'string' ? {text: obj} : obj);
    };
};