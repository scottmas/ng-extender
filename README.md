### ngExtender ###
------------

ngExtender is a library that allows arbitrary Javascript to be injected
at the end of a directives link function or the end of named controllers.

Unlike most angular libraries, this library does not NEED to be loaded as a module in your
main application configuration. Instead it must be included after the angular core load,
before any of its methods are used.

Config:
```
angular.module('yourApp', ['customBind', ...])
```

Usage:
```
//Extend a controller's constructor
angular.module('mainApp').extendService('someController', ['$scope', function($scope){

	//code you want to inject at the end of someController

}])

//Extend a directive's link function
angular.module('mainApp').extendService('someDirective', function(scope, elm){ //Note that you do not have access to attr

	//code you want to inject at the end of someDirective's link function

})
```