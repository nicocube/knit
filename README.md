# Knit.js

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

	var fs = require('fs');
	var http = require('http');
	
Become :

	require('knit')(function(http, fs) {
		...
	})
	
Ok but this is longer to write than the original, what is the interest ? Here come the fun part, you can now configure your knit to choose your implementation.
	
	var fake_http = {
		... // mock your module for test purpose for eg.
	};
	
	var res = knit({http: fake_http},function(http,fs) {
		...
		return result; // inject will return this result
	});
	
Ok this starts to be cool but we can go further. Let's use it as a module definition :

./lib/foo.js

    module.exports = function (http,fs) {
		...
		return result; // inject will return this result
	});
    
And then run unit test on it :

./spec/foo.spec.js

    require(knit)(
        './lib/foo.js', // will be automatically binded to 'foo' parametter by script name
        {http: { /* some mock implementation here */ } },
        {fs: { /* some mock implementation here */ } },
        function (foo) {            
            describe("...", function() {
                it("...",function() {
                    // some test on mocked foo here
                })
            })
        }
    )
	
## Next ?

Short term: Build more doc and examples. Create new apps and framework with it.

Long term: Think about porting knit.js in the browser context.
