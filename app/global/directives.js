captureControlApp.directive('fileModel', ['$parse', function ($parse) {
    return {
       restrict: 'A',
       link: function(scope, element, attrs) {
          var model = $parse(attrs.fileModel);
          var modelSetter = model.assign;
          
          element.bind('change', function() {
        	  scope.$apply(function() {
        		  modelSetter(scope, element[0].files[0]);
        	  });
          });
       }
    };
 }]);
 
 captureControlApp.directive('barcodeScanner', function() {
  return {
    restrict: 'A',    
    scope: {
        callback: '=barcodeScanner',        
      },      
    link: function postLink(scope, iElement, iAttrs){       
        // Settings
        var enterCode = 13;    
        var minLength = 3;
        var delay = 300; // ms
        
        // Variables
        var pressed = false; 
        var chars = []; 
        var enterPressedLast = false;
        
        // Timing
        var startTime = undefined;
        var endTime = undefined;
        
        var keypressHandler = function(e) {
            if (chars.length === 0) {
                startTime = new Date().getTime();
            } else {
                endTime = new Date().getTime();
            }
            if (e.which != enterCode) {
                chars.push(String.fromCharCode(e.which));
            }

            enterPressedLast = (e.which === enterCode);

            if (pressed == false) {
                setTimeout(function(){
                    if (chars.length >= minLength && enterPressedLast) {
                        var barcode = chars.join('');
                        if (angular.isFunction(scope.callback)) {
                            scope.$apply(function() {
                                scope.callback(barcode);
                            });
                        }
                    }
                    chars = [];
                    pressed = false;
                },delay);
            }
            pressed = true;
        };

        jQuery(document).on('keypress', keypressHandler);

        scope.$on('$destroy', function() {
            jQuery(document).off('keypress', keypressHandler);
        });
    }
  };
});

captureControlApp.directive('valueMatches', ['$parse', function ($parse) {
    return{
    	require: 'ngModel',
        link: function (scope, elm, attrs, ngModel) {
        	var originalModel = $parse(attrs.valueMatches), secondModel = $parse(attrs.ngModel);
          scope.$watch(attrs.ngModel, function (newValue) {
            ngModel.$setValidity(attrs.name, newValue === originalModel(scope));
          });
          scope.$watch(attrs.valueMatches, function (newValue) {
            ngModel.$setValidity(attrs.name, newValue === secondModel(scope));
          });
        }
      };
    }]);  