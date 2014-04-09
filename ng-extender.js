(function(angular, window){

    //This library allows you to inject arbitrary javascript at the end of a directives link function or the end of a named controller.

    //This library must be loaded directly after the angular core, or at least before any of its methods (defined on angular.module(..)) are used.
    var ngExtender = angular.module('ngExtender', [])

    var CtrlScopeExtensions = {},
        CtrlServiceExtensions = {};

    function extendService (name, expression){
        if(!CtrlServiceExtensions [name]) CtrlServiceExtensions[name] = [];
        CtrlServiceExtensions [name].push(expression);
    }

    function extendScope (name, extensionObj) {
        if(!CtrlScopeExtensions[name]) CtrlScopeExtensions[name] = [];
        CtrlScopeExtensions[name].push(extensionObj);
    }

    var origModule = angular.module;

    angular.module = function(){
        var module = origModule.apply(this, [].slice.call(arguments));
        angular.extend(module, {
            extendService: function( name, fn){
                module.config(['$provide', '$injector', function($provide, $injector){

                    if ($injector.has(name + "Directive")){
                        $provide.decorator(name + "Directive", function($delegate, $controller) {

                            if(!angular.isFunction(fn)){
                                console.error("Only link functions on directives can be extended. Please pass a function")
                            }

                            var directive = $delegate[0],
                                origCtrl = directive.controller,
                                origLink = directive.link,
                                origCompile = directive.compile;

                            if(typeof origCompile === 'function'){
                                if(origCompile.toString().length < 30){ //Workaround to test for for empty compile function (namely: function(){return value;})
                                    directive.compile = function(){
                                        return {
                                            pre: origCompile.pre || function(){},
                                            post: function(scope, elm, attrs, controller){
                                                var args = [].slice.call(arguments);
                                                fn.apply(this, args)
                                                origLink.apply(this, args) //If compile property is not defined, simply call link fn on compile
                                            }
                                        }
                                    }
                                } else{
                                    directive.compile = function compileFn(){
                                        return {
                                            pre: origCompile.pre || function(){},
                                            post: function(scope, elm, attrs, controller){
                                                var args = [].slice.call(arguments);
                                                fn.apply(this, args)
                                                origCompile.apply(this, args) //If compile property is not defined, simply call link fn on compile
                                            }
                                        }
                                    }
                                }
                            } else{
                                //If compile property is declared with pre and post
                                directive.compile = function(){
                                    return {
                                        pre: origCompile.pre || function(){},
                                        post: function(scope, elm, attrs, controller){
                                            var args = [].slice.call(arguments);
                                            fn.apply(this, args)
                                            origCompile.post.apply(this, args);
                                        }
                                    }
                                }
                            }

                            /*
                             //If we ever want to be able to modify the directive controller, you do it like so.
                             directive.controller = ["$scope", '$timeout', function($scope, $timeout) {
                             $controller(origCtrl, {$scope: $scope});

                             $scope.name = 'Bob!!!';
                             $timeout(function() {
                             $scope.name = "from the decorator now";
                             }, 3000);
                             }];*/

                            return $delegate;
                        });
                        //No service found
                    }

                    //try controllers
                    else {

                        extendService(name, fn);
                        $injector.has(name);
                        $provide.decorator('$controller', ['$injector', '$delegate', '$parse', '$window',
                            function($injector, $delegate, $parse, $window) {
                                var context = this;

                                //Controller constructor function
                                return function() {

                                    var orig = $delegate.apply(context, [].slice.call(arguments));

                                    if(typeof arguments[0] !== 'string') //The decorator only can be used on named controllers
                                        return orig;

                                    if(!arguments[1] || !arguments[1].$scope){
                                        console.error("$scope not found. One potential reason could be that the angular core specifications for the $controller have changed and the ngExtender module requires refactoring")
                                        return orig;
                                    }

                                    var locals = arguments[1],
                                        scope = locals.$scope,
                                        ctrlName = arguments[0],
                                        ctrlExtensions = CtrlServiceExtensions[ctrlName] || [],
                                        scopeExtensions = CtrlScopeExtensions[ctrlName] || [],
                                        i, ii;

                                    for(i = 0, ii = scopeExtensions.length; i < ii; i++ ){
                                        angular.extend(scope, scopeExtensions[i]);
                                    }

                                    for(i = 0, ii = ctrlExtensions.length; i < ii; i++ ){
                                        $injector.invoke(ctrlExtensions [i], null, locals);
                                    }

                                    return orig;

                                };
                            }]);
                    }
                }])
            },
            extendScope: function(name, extension){

            }
        })
        return module;
    }

    //Todo find a way to configure the invoke queue so that serviceExtenders always run last, AFTER directives
    //and controllers have registered on the module.

    //Todo, until we get the above working we need to notify the user if they registered extensions that never ran.

})(window.angular, window)
