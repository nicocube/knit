# Knit.js

## Why ?

Node.js require is simple and efficient, using cached modules and so on. But it's also not totally flexible when your project can have dependencies that can have multiple implementation. To finish with this `var fs = require('fs');` have `fs` twice which is not perfectly dry code. ;)

Furthermore, dependencies inside code is heavy to maintain and does not end with modules. IoC and Dependency Injection are useful concepts that can be tailored by hand, but tools can help.

Knit come from my experience using Guice in the java world, but also Spring and CDI. I attempted to keep Guice concepts that are applicable inside node.js and javascript, aiming for a really simple implementation and API. It's far from doing as much as its predecessor but I hope it'll help someone (apart from me, because I use it a lot).

## Basic concepts

Knit embed a function, read the param name of the method and try to find a matching component into his config. If not, it tries to require the name.

For example :

	var fs = require('fs');
	var http = require('http');
	
Become :

	require('knit').inject(function(http, fs) {
		...
	})
	
Ok but this is longer to write than the original, what is the interest ? Here come the fun part, you can now configure your knit to choose your implementation.
	
	var fake_http = {
		... // mock your module for test purpose for eg.
	};
	
	// config is chainable
	var res = knit.config({http: fake_http}).inject(function(http,fs) {
		...
		return result; // inject will return this result
	});
	
Ok this starts to be cool but we can go further.

	var _f = function f() { /* implement constructor here*/ };
	var _g = function g() {return {universe:42};};
	var _count = 0;
	var _h = function h(a, f) { /* implement constructor here*/ };
	
	knit.config(function (bind) {
		bind('a').to({...});					// bind 'a' name to the instance of the passed object as singleton
		bind('b').to({...}).is('singleton');	// like 'a' but with 'b' name, the previous was the default behavior
		bind('c').to({...}).is('clone');		// bind 'c' name to clone of the given object
		bind('d').to(_g).is('builder');			// bind 'd' name to create a new instance by running function g 
		bind('e').to(_f).is('constructor');		// bind 'e' name to create a new instance by using h as constructor function 
		bind(_f);								// like 'e' but with 'f' name retrieved from function definition
		bind(_g).is('builder');					// bind 'g' name as a builder function
		bind(_h).is('constructor');				// like 'f' but with 'h' name, the previous was the default behavior.
		                       					// h parameter will themself be injected throught knit 
	});
	
	knit.inject(function(a, b, c, d, e, f, g, h) {
		... // play with the created stuff, change the config if unsastified
	})
	
## Next ?

Test knit.js in the browser context and tell you about it. :)