angular.module('platen.directives').directive('editableMarkdown', function () {
    return {
        restrict: 'EA',
        require: '?ngModel',
        priority: 1,
        compile: function (tElement) {
            //replace link with compile for elem replacement
            // Require CodeMirror
            if (angular.isUndefined(CodeMirror)) {
                throw new Error('ui-markdown-editor need CodeMirror to work... (o rly?)');
            }

            // Create a codemirror instance with
            // - the function that will to place the editor into the document.
            // - the initial content of the editor.
            //  see http://codemirror.net/doc/manual.html#api_constructor
            var value = tElement.text();
            var codeMirror = new CodeMirror(function (cmElement) {
                //get all attrs from the origin element
                angular.forEach(tElement.prop('attributes'), function (a) {
                    if (a.name === 'data-editable-markdown') {
                        cmElement.setAttribute('data-editable-markdown-opts', a.value); //change
                    } else {
                        cmElement.setAttribute(a.name, a.value);
                    }
                });

                // FIX replaceWith throw not parent Error !
                if (tElement.parent().length <= 0) {
                    tElement.wrap('<div>');
                }

                tElement.replaceWith(cmElement);
            }, {
                value: value,
                mode: 'markdown',
                theme: 'paper',
                tabSize: '4',
                indentWithTabs: true,
                lineWrapping: true,
                lineNumbers: false,
                autofocus: false
                //extraKeys: keyMaps
            });

            return function postLink($scope, $element, attrs, $ngModel) {
                if (!$ngModel) return;

                $ngModel.$render = function () {
                    //$element.html($ngModel.$viewValue || '');
                    codeMirror.setValue($ngModel.$viewValue || '');
                };

                var read = function (newValue) {
                    $scope.post.contentMarkdown = newValue;
                    $ngModel.$setViewValue(newValue);
                };

                // Specialize change event @TODO: keyup, paste
                codeMirror.on('change', function (instance) {
                    var newValue = instance.getValue();
                    if ($ngModel && newValue !== $ngModel.$viewValue) {
                        read(newValue);
                    }
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });

                codeMirror.on('blur', function () {
                    $scope.$emit('elementEdited', $element[0].id);
                });

                read(codeMirror.getValue());
            };
        }
    };
});