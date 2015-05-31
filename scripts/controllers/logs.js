var LogsController = function($scope, logger) {
  $scope.logs = logger.getLogs();
};

LogsController.$inject = ['$scope', 'logger'];
angular.module('platen.controllers').controller('LogsController', LogsController);