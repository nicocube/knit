/*
 * Copyright 2012 Nicolas Lochet Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *      
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

(function(exports) {
	"use strict"

	var _fs = require('fs'), _http = require('http')
	
	/**
	 * Permit each test to run with a clean new required knit
	 */
	function independent_require(cb) {
		return function (test) {
			var place = __dirname.substring(0,__dirname.length-5)+'/lib/knit.js'
			//console.log(place)
			var knit = require(place)
			cb(knit, test)
			//console.log(require.cache[place].exports === knit)
			delete require.cache[place]
			//console.log(require.cache[place] === undefined)
		}
	}
	
	exports["should retrieve native node module"] = independent_require(function (knit,test) {
		knit
		.inject(function(http, fs) {
			test.strictEqual(fs, _fs)
			test.strictEqual(http, _http)
		},true)
		// chain
		.inject(function(fs, http) {
			// any order
			test.strictEqual(fs, _fs)
			test.strictEqual(http, _http)
		},true)
		test.done()
	})
	
	exports["should retrieve native node module and object defined dependencies"] = independent_require(function (knit,test) {
		var fake_http = {}
		knit.config({http:fake_http}).inject(function(http,fs) {
			test.strictEqual(fs, _fs)
			test.strictEqual(http, fake_http)
		})
		test.done()
	})
	
	exports["should retrieve native node module and function binding defined dependencies"] = independent_require(function (knit,test) {
		var _z = {}, _count = 0, _w, _x, _y, _a, _f
		var _b = function b() {}
		var _c = function c() {return _z}
		var _d = function d() {this.c = _count++/*console.log('c',this.c)*/}
		var _e = function e(w,x) {this.c = _count++; this.w = w; this.x = x /*console.log('c',this.c)*/}
		knit.config(function (bind) {
			bind('w').to({})
			bind('x').to({}).is('singleton')
			bind('y').to({}).is('clone')
			bind('z').to(_c).is('builder')
			bind('a').to(_d).is('constructor')
			bind(_b).is('singleton')
			bind(_c).is('builder')
			bind(_d)
			bind(_e).is('constructor')			
		})
		.inject(function(w,x) {
			// init singletons intances
			_w = w
			_x = x
		},true)
		.inject(function(w,x) {
			// validate singleton instances
			test.strictEqual(w, _w)
			test.strictEqual(x, _x)
		},true)
		.inject(function(z) {
			// validate builder cases
			test.strictEqual(z, _z)
		},true).inject(function(y) {
			// init prototype instances
			_y = y
		},true)
		.inject(function(y) {
			// validate prototype instances
			test.notStrictEqual(y, _y)
			test.deepEqual(y, _y)
		},true)
		.inject(function(a) {
			// init constructor instances
			_a = a
		},true)
		.inject(function(a) {
			// validate constructor instances
			test.notStrictEqual(a, _a)
			test.equal(_a.c, 0)
			test.equal(a.c, 1)
		},true)
		.inject(function(b) {
			// validate function singleton cases
			test.strictEqual(b, _b)
		},true)
		.inject(function(c) {
			// validate function builder cases
			test.strictEqual(c, _z)
		},true)
		.inject(function(d) {
			// init function constructor cases
			_f = d
		},true)
		.inject(function(d) {
			// validate function builder cases
			test.notStrictEqual(d, _e)
			test.equal(_f.c, 2)
			test.equal(d.c, 3)
		},true)
		.inject(function(e) {
			// init function constructor cases
			_f = e
		},true)
		.inject(function(e) {
			// validate function builder cases
			test.notStrictEqual(e, _e)
			test.equal(_f.c, 4)
			test.equal(e.c, 5)
			test.equal(e.w, _w)
			test.equal(e.x, _x)
		},true)
		test.done()
	})

})(exports)
