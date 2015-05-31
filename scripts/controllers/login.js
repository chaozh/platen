var LoginController = function($scope, $modalInstance, wordpress) {
  wordpress.loadCredentials(function(login) {
    $scope.login = {
      url: login.url,
      username: login.username,
      password: login.password,
      rememberPassword: login.rememberPassword
    };
    $scope.$apply();
  });

  $scope.submit = function() {
    // Ensure that the url starts with a http, if it isn't already specified
    if(!/^https?:\/\//i.test($scope.login.url)) {
      $scope.login.url = 'http://' + $scope.login.url;
    }
    wordpress.saveCredentials($scope.login);
    $modalInstance.close();
  };

  $scope.resetCredentials = function() {
    wordpress.resetCredentials();
    $modalInstance.close();
  };

  $scope.cancel = function() {
    $modalInstance.close();
  };
};

LoginController.$inject = ['$scope', '$modalInstance', 'wordpress'];
angular.module('platen.controllers').controller('LoginController',LoginController);