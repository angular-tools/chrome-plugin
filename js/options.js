var Options = new function () {
    /**
     * Get the Plugin object (from background script) and optionally extend $scope with default options, and three functions: load, update and clear
     *
     * @returns {Plugin}
     */
    this.getPlugin = function ($scope, defaults) {
        var Plugin = chrome.extension.getBackgroundPage().Plugin;

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
                Plugin.set('options', options || $scope.options, apply);
            };

            $scope.clear = function () {
                $scope.update(defaults || {});
            };

            $scope.load();
        }
    };
};