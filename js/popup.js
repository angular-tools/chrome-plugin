var Popup = new function () {
    /**
     * Get the Plugin object (from background script)
     *
     * @param {function} cb - callback to return with Plugin object
     * @param {object} $scope - angular $scope to extend (optional)
     *
     */
    this.getPlugin = function (cb, $scope) {
        chrome.runtime.getBackgroundPage(function (background) {
            var Plugin = background.Plugin;

            if ($scope) {
                $scope.data = Plugin.data || {};

                Plugin._refresh = function () {
                    try {
                        if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                            $scope.$apply();
                        }
                    } catch (e) {
                    }
                };

                Plugin.get('options', function (options) {
                    $scope.options = options || {};
                    Plugin._refresh();
                }, {}, false);

                Plugin.get('data', function (data) {
                    //console.log("data: ", data);
                    Plugin.data = $scope.data = data || {};
                    Plugin._refresh();
                });
            }

            cb(Plugin);
        });
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