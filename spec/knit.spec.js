/*
 * Copyright 2013 Nicolas Lochet Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *      
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

/**
* strategy to load, test, and clean cache
*/
function independent_require(cb) {
    return function () {        
        var place = __dirname+'/../lib/knit.js'
        //console.log(place)
        var knit = require(place)
        cb(knit)
        //console.log(require.cache[place].exports === knit)
        delete require.cache[place]
        //console.log(require.cache[place] === undefined)
    }
}

describe("Knit in context:", function() {
    it("should return empty config", independent_require(function(knit) {
        var run = false
        var config = knit()
        expect(config).toEqual({knit : { k : 'knit', $ : '$asis', _ : knit }})
    }))
    
    it("should return config", independent_require(function(knit) {
        knit(
            {jasmine:'jasmine-node'}, 
            {foo: "../test-mock/b/foo.js"}
        )
        var config = knit()
        expect(typeof config).toEqual("object")
        
        expect(config.jasmine.k).toEqual('jasmine')
        expect(config.jasmine.$).toEqual('$unique')
        expect(config.jasmine._).toEqual(require('jasmine-node'))
        
        expect(config.foo.k).toEqual('foo')
        expect(config.foo.$).toEqual('$prototype')
        expect(config.foo._.toString()).toEqual(function() {
    return {foo:c++, common:"same"}
}.toString())
    }))
    
    it("should find node core module", independent_require(function(knit) {
        var run = false
        knit(function (fs) {
            expect(fs).toEqual(require('fs'))
            run = true
        })
        expect(run).toEqual(true)
    }))
    
    it("should find local npm module", independent_require(function(knit) {
        var run = false
        knit({jasmine:'jasmine-node'})
        knit(function (jasmine) {
            expect(jasmine).toEqual(require('jasmine-node'))
            run = true
        })
        expect(run).toEqual(true)
    }))
    
    it("should find another local npm module", independent_require(function(knit) {
        var run = false
        knit({cookieParser:'cookie-parser', $:'='})
        knit(function (cookieParser) {
            expect(cookieParser).toEqual(require('cookie-parser'))
            run = true
        })
        expect(run).toEqual(true)
    }))
    
    it("should find local in caller folder script", independent_require(function(knit) {
        var run = false
        knit(function (x) {
            expect(x.x).toEqual("local and no deps")
            run = true
        })
        expect(run).toEqual(true)
    }))
    
    it("should find local in caller sub folder script", independent_require(function(knit) {
        var run = false
        knit(function (y) {
            expect(y.x.x).toEqual("local and no deps")
            run = true
        })
        expect(run).toEqual(true)
    }))
    
    it("Complete config and injection", independent_require(function(knit) {
        
        knit(
            "../test-mock/a/",
            {foo: "../test-mock/b/foo.js"},
            {bar: "../test-mock/b/bar.js", $:'!'},
            {plop: "../test-mock/b/plop.js", $:'!', _:[
                {a: "../test-mock/b/no_a.js"}
            ]},
            {plip: "../test-mock/b/plop.js", $scope:'$unique', _:[
                {a: function() {return {a:42}}}
            ]},
            {plouf: function(foo, bar) { return {foo:foo, bar:bar}}, $:'!'},
            function plaf(plouf){ return plouf }
        )
        
        var run = false
        
        knit(function (x,a,b,foo, bar, plop, plip, plouf) {
            expect(x.x).toEqual("local and no deps")
            
            expect(a.a).toEqual("local and no deps")
            expect(a.c).toEqual(0)
            
            expect(b.b).toEqual("mine")
            expect(b.a).not.toEqual(a)
            expect(b.a.c).toEqual(1)
            expect(b.a.a).toEqual(a.a)
            
            expect(foo.foo).toEqual(0)
            expect(foo.common).toEqual("same")
            
            expect(bar.bar).toEqual(0)
            expect(bar.foo).not.toEqual(foo)
            expect(bar.foo.foo).toEqual(1)
            expect(bar.foo.common).toEqual(foo.common)
            
            expect(plop.plop).toEqual("plip")
            expect(plop.a).not.toEqual(a)
            expect(plop.a.c).not.toBeDefined()
            expect(plop.a.a).toEqual("local and no deps, but not a")
            
            expect(plip.plop).toEqual("plip")
            expect(plip.a).not.toEqual(a)
            expect(plip.a.c).not.toBeDefined()
            expect(plip.a.a).toEqual(42)
            
            expect(plouf.foo).not.toEqual(foo)
            expect(plouf.foo.foo).toEqual(2)
            expect(plouf.foo.common).toEqual(foo.common)
            expect(plouf.bar).toEqual(bar)
            expect(plouf.bar.bar).toEqual(0)
            
            run = true
        })
        
        expect(run).toEqual(true)
    }))
})

describe("Self injection:", function() {
    it("should auto inject", independent_require(function(knit) {
        var run = false
        var kn = knit
        
        knit(function (knit) {
            expect(knit).toEqual(kn)
            run = true
        })
        expect(run).toEqual(true)
    }))
    
    it("should work with auto injected knit", independent_require(function(K) {
        var run = false
        K(function (knit) {
            knit(
                "../test-mock/a/",
                {foo: "../test-mock/b/foo.js"},
                {bar: "../test-mock/b/bar.js", $:'!'}
            )
            
            knit(function (x,a,b,foo, bar, plop, plip, plouf) {
                expect(x.x).toEqual("local and no deps")
                
                expect(a.a).toEqual("local and no deps")
                expect(a.c).toEqual(2)
                
                expect(b.b).toEqual("mine")
                expect(b.a).not.toEqual(a)
                expect(b.a.c).toEqual(3)
                expect(b.a.a).toEqual(a.a)
                
                expect(foo.foo).toEqual(3)
                expect(foo.common).toEqual("same")
                
                expect(bar.bar).toEqual(1)
                expect(bar.foo).not.toEqual(foo)
                expect(bar.foo.foo).toEqual(4)
                expect(bar.foo.common).toEqual(foo.common)
                
                run = true
            })
        })
        expect(run).toEqual(true)
    }))
})
