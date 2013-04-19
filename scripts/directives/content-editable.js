angular.module('platen.directives').directive('editable', function() {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function(scope, element, attrs, ngModel) {
      if (!ngModel) return;

      ngModel.$render = function() {
        element.html(ngModel.$viewValue || '');
      };

      element.bind('blur keyup change', function() {
        scope.$apply(read);
      });

      var read = function() {
        ngModel.$setViewValue(element.context.innerText);
      };

      element.bind('blur paste', function() {
        scope.$emit('postContentChanged');
      })

      read();
    }
  };
});