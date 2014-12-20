angular.module('platen.directives').directive('editableMarkdown', function() {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function($scope, $element, attrs, $ngModel) {
      if (!$ngModel) return;

      $ngModel.$render = function() {
        $element.html($ngModel.$viewValue || '');
      };

      $element.bind('blur keyup change', function() {
        $scope.$apply(read);
      });

      var read = function() {
        $scope.post.contentMarkdown = $element.context.innerText;
        $ngModel.$setViewValue($element.html());
      };

      //init paste event
      var pasteAppend = function(evt) {
        var data = (evt.originalEvent || evt).clipboardData.getData('text/plain');
        evt.preventDefault();
        //data = escape(data);
        if (!_.isEmpty(data)) {
          //adjustCursorPosition();
          document.execCommand('insertHtml', false, data);
        }   
      };

      $element.bind('blur', function() {
        $scope.$emit('elementEdited', $element[0].id);
      });

      $element.bind('paste', function(evt) {
        pasteAppend(evt);
        $scope.$emit('elementEdited', $element[0].id);
      });

      read();
    }
  };
});