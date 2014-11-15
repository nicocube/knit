# Knit.js [![NPM version][npm-image]][npm-url]

## Why ?

Node.js require function is simple and efficient, using cached modules and so on.

But writing this `var fs = require('fs');` make you write `fs` twice which is not perfectly dry code. ;)

This is also not totally flexible. Imagine you have a module and you want to use an extended version of it ? Then your should have to change the require() call in every script of your code. For a small app, it's not too much of work, for a big one, it's certainly a risk of mistake.

## The Knit project

Knit propose a different approach, even if not an original one. The project was first inspired by experiences using Guice in the java world, but also Spring and CDI, my many readings of Martin Fowler and Misko Hevery articles on dependency injection, inversion of control, and unit test.

The version 0.0.2 of knit, which was written for node 0.6, and that you can find in the download section was my first attempt at that. Since then I had no so much time to make the project live (plenty of work to do), and as it was to happen, it was broken due to the evolution of Node.js that I had no time follow well. In the meantime, my job gave me the opportunity to learn RequireJS, and then AngularJS (Misko Hevery ! ^.^), and discover his take on DI. This gave me some new ideas, and the will to make them live.

So here we go for a 0.1.x version for Knit !

## Basic concepts

The idea of Knit, is to use function parameters name to retrieve matching dependencies. It follows a set of conventions to search differents scopes in order to find the right dependencies, and then to choose how to inject dependencies.

For example :

```javascript
var fs = require('fs');
var http = require('http');
```
	
Become :

```javascript
require('knit')(function(http, fs) {
    ...
})
```
	
Ok we dried the code a little but this is almost as long to write than the original. What is the interest ? Here come the fun part, you can now configure your knit to choose your implementation.

```javascript
var knit = require('knit')
var fake_http = {
    ... // mock your module for test purpose for eg.
};

knit({http: fake_http})

var res = knit(function(http,fs) {
    ...
    return result; // inject will return this result
});
```
	
Ok this starts to be cool but we can go further. Let's use it as a module definition :

./lib/foo.js

```javascript
    module.exports = function (http,fs) {
		...
		return result; // inject will return this result
	});
```
    
And then run unit test on it :

./spec/foo.spec.js

```javascript
var knit = require('knit')
knit(
    '../lib/foo.js', // will be automatically binded to 'foo' parametter by reading script name
    {http: { /* some mock implementation here */ } },
    {fs: { /* some mock implementation here */ } }
)
knit(function (foo) {            
    describe("...", function() {
        it("...",function() {
            // some test on mocked foo here
        })
    })
})
```

## Auto-inject

Knit auto-inject itself so you can write the following :

```javascript
require('knit')(function(knit) {
    knit('./lib/foo.js')
    knit(function (foo) {
        ...
    })
})
```

This can look silly but it can be a useful pattern.

## Implicit lookup

One powerful feature of knit is that it will automagically search the current folder for a script even if it's not previously defined.

So if you still have your foo.js dependency in `./lib/foo.js` and you write the following `./app.js` script :

```javascript
require('knit')(function (foo) {
    ...
})
```

Then knit will see an implicit declaration of foo, scan the local folder and sub folder, find `./lib/foo.js`, and load it !

The rule followed by knit for implicit declaration is :
  1. search first for a node module corresponding the parametter name using the classic node `require` fonction (ex: `knit(function(foo) {...` does `require('foo')` first)
  2. if no module found then scan the local folder depth-first for a *.js* file corresponding to the parametter name (ex: `knit(function(foo) {...` leads to `./lib/foo.js`)

NB: the scan of the local folder exclude the node_modules folder (this is node restricted area).


## Scope

Knit proposes 4 kinds of scope to inject elements:
  1. **prototype** : the element is new with each injection.
  2. **unique** : the element is unique, the same one will be injected in every situation (singleton done right).
  3. **as is** : the element is to be injected as it is given by definition.
  4. **require as is** : the element is to be required then injected as it is exported by the module.

For **prototype** scope the element definition must be a function or a module that exports a function. This function will be *knitted* (meaning called with knit to provide parametters through injection) each time we need a new instance. Implicitly any definition that is an anonymous function is seen as **prototype**. As for now an object cannot be used as a prototype definition.

The **unique** scope defines a unique object. It can be defined as a named object, as a module that export an object, or as a function that will be *knitted* and injected once when defined explicitly, or when first injected implicitly. Implicitly any definition that is an object is seen as **unique**.

For **as is** scope, the definition is taken as it is, even if it is a function, and injected as is. The **as is** scope definition is useful to define function on the spot, string and especially path because the default behavior of knit is to scan paths.

**Require as is** scope is a variant of **as is** scope for imported module, the module or script is required first, and then stored and injected as is in every dependent component. Implicitly any definition of module that refer a named function whose name match the module name, or a named function injected in configuration, is seen as **require as is**.

## Explicit definitions

Definition can be a string, a function with a name, or an object following certain rule.

* **string** : it can be a module name, a script name, a path to a script or a path to a folder to scan.
* **function with a name** : the name will be used as reference name for future injection and the function will be knitted in require as is scope.
* **object** : follows these rules :
  1. if it is an Array (array is an object), all his elements will be parsed as independent definition
  2. otherwise it must have one and only one arbitrary key representing the wanted injection name
  3. the value associated with the key can be any type
  3. the `_` key can be used in place of an arbitrary key to define a name that is the same as its value 
  4. the `$` or `$scope` key can be used to define the scope with the following values :
    * '$prototype' or '@' for **prototype** scope
    * '$unique' or '!' for **unique** scope
    * '$asis' or '=' for **as is** scope
    * '$require' or '&' for **require as is** scope
  5. the `$$` or `$dependendies` key with an array value containing a list of dependencies of the module. The dependencies defined in this array locally replace any global definition. 

Examples :

```javascript
knit(
    'fs', // load fs node standard module explicitly (doubtfully usefull but works)
    'express', // load express module from node_modules explicitly (also doubtfully usefull but works)
    'foo', // load foo explicitly with a recursive scan of local folder
    './lib/bar.js', // load bar from ./lib/bar.js
    './other_lib', // load every script from ./other_lib folder (use at your own risks)
    
    function booya(foo) { ...; return ...}, // register booya as a function that will be injected foo to build an instance, implicitly in $require scope
    
    {fizzBuzz: './lib/fizz-buzz.js'}, // load fizz-buzz.js script and bind it to fizzBuzz for future injection (scope is implicit)
    
    {passportGoogle: 'passport-google'}, // load passport-google module in unique scope and bind it to passportGoogle for future injection (scope is implicit)
    
    {cookieParser: 'cookie-parser', $:'&'}, // load cookie-parser module in 'require as is' scope, short definition
    
    {_: 'morgan', $:'&'}, // load morgan module in 'require as is' scope, short definition, use $$ form in place of {morgan: 'morgan', $:'&'}, because it is drier
    
    {myfun: function(a, b) {...}, $:'='}
    
    {basedir: __dirname, $:'='}, // register basedir as the string that represent the name of the folder of the current script using __dirname variable, with $asis scope short form definition (to avoid a wild scan of current folder to find a basedir script)
    
    {router: function(express) { return express.Router() }, $:'!'}, // define a function builder for parametter name router that will be injected express to provide a express.Router instance, in $unique scope short form definition
    {routerWithOptions: function(express, router_options) { return express.Router(router_options) }, $:'$unique'}, // define a function builder for parametter name routerWithOptions that will be injected express and router_options to provide a express.Router instance, in $unique scope long form definition

    {plop1: "plop.js", $:'!', $$:[ {a: "a1.js"} ]}, // create a unique instance plop1 from script plop.js injecting dependecy a requiring module a1.js 
    
    {plop2: "plop.js", $:'!', $$:[ {a: "a2.js"} ]}, // create a unique instance plop2 from script plop.js injecting dependecy a requiring module a2.js
    
    ...
)
```

## Other useful definition

Knit permit to define a root folder to start scan from.

```javascript
knit(
    {__knit_path:['./lib']},
)
```

This permit to prevent knit to scan from other folder than the defined one. This is useful to separate script for the backend and frontend part of a dev.


## Next ?

Short term: Build more doc and examples. Create new apps and framework with it.

Long term: Think about porting knit.js in the browser context.

[npm-url]: https://npmjs.org/package/knit
[npm-image]: https://badge.fury.io/js/knit.png

