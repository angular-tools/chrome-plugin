var Options = new function () {
    /**
     * Get the Plugin object (from background script) and optionally extend $scope with default options, and three functions: load, update and clear
     *
     * @param {function} cb - callback to return with Plugin object
     * @param {object} $scope - angular $scope to extend (optional)
     * @param {object} defaults - default object to initialize options
     *
     */
    this.getPlugin = function (cb, $scope, defaults) {
        chrome.runtime.getBackgroundPage(function (background) {
            var Plugin = background.Plugin;

            if ($scope) {
                var apply = function () {
                    if ($scope.$root.$$phase != '$apply' && $scope.$root.$$phase != '$digest') {
                        $scope.$apply();
                    }
                };

                $scope.load = function () {
                    Plugin.get('options', function (options) {
                        $scope.options = options || defaults || {};
                        apply();
                    }, defaults, false);
                };

                $scope.update = function (options) {
                    var promise = {then: function (cb) {this.cb = cb;}};

                    Plugin.set('options', options || $scope.options, function () {
                        apply();

                        if (typeof(promise.cb) == 'function') {
                            promise.cb();
                        }
                    });

                    return promise;
                };

                $scope.clear = function () {
                    return $scope.update(defaults || {});
                };

                $scope.load();
            }

            return Plugin;
        });
    }
};