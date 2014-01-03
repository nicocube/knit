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
        console.log(place)
        var knit = require(place)
        cb(knit)
        //console.log(require.cache[place].exports === knit)
        delete require.cache[place]
        //console.log(require.cache[place] === undefined)
    }
}

describe("Knit in context", function() {
    it("Defining complete config and inject", independent_require(function(knit) {
        knit(function (x) {
            expect(x.x).toEqual("local and no deps")
        })
    }))
    
    it("Defining complete config and inject", independent_require(function(knit) {
        
        knit([
            "../test-mock/a/",
            {foo: "../test-mock/b/foo.js"},
            {bar: "../test-mock/b/bar.js", $:'unique'},
            {plop: "../test-mock/b/plop.js", $:'unique', _:[
                {a: "../test-mock/b/no_a.js"}
            ]},
            {plip: "../test-mock/b/plop.js", scope:'unique', dependencies:[
                {a: function () {return {a:42}}}
            ]},
            {plouf: function(foo, bar) { return {foo:foo, bar:bar}}}
        ])
        
        knit(function (x,a,b,foo, bar, plop, plip, plouf) {
            expect(x.x).toEqual("local and no deps")
            
            expect(a.a).toEqual("local and no deps")
            expect(a.c).toEqual(0)
            
            expect(b.b).toEqual("mine")
            expect(b.a).not.toEqual(a)
            expect(b.a.c).toEqual(1)
            expect(b.a.a).toEqual(a.a)
            
            expect(foo.foo).not.toEqual(0)
            expect(foo.common).not.toEqual("same")
            
            expect(bar.bar).not.toEqual(0)
            expect(bar.foo).not.toEqual(foo)
            expect(bar.foo.foo).not.toEqual(1)
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
            expect(plouf.foo.common).toEqual(foo.common)
            expect(plouf.bar).toEqual(bar)
            expect(plouf.bar.bar).toEqual(0)
        })
    }))
})
