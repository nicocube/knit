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

var knit = require(__dirname+'/../lib/knit.js')

describe("Parse object config:", function() {
    it("Should bind implicit prototype definition", function() {
        var r = knit.parse({foo:"../test-mock/b/bar.js"})
        expect(r.k).toEqual('foo')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {bar:c++, foo:foo, common:"same"}
}.toString())
    })
    
    it("Should resolve a module", function() {
        var r = knit.parse({plop:'fs'})
        expect(r.k).toEqual('plop')
        expect(r.$).toEqual('$unique')
        expect(r._).toEqual(require('fs'))
    })
    
    it("Should bind implicit definition to name $", function() {
        var r = knit.parse({$:"../test-mock/b/bar.js"})
        expect(r.k).toEqual('$')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {bar:c++, foo:foo, common:"same"}
}.toString())
    })
    
    it("Should bind explicit prototype definition", function() {
        var r = knit.parse({foo:"../test-mock/b/bar.js", $:'$prototype'})
        expect(r.k).toEqual('foo')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {bar:c++, foo:foo, common:"same"}
}.toString())
    })
    
    it("Should bind explicit prototype definition invert param order", function() {
        var r = knit.parse({$:'$prototype', foo:"../test-mock/b/bar.js"})
        expect(r.k).toEqual('foo')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {bar:c++, foo:foo, common:"same"}
}.toString())
    })
    
    it("Should fail explicit prototype definition with not existing file", function() {
        expect(function() { 
            knit.parse({foo:"../test-mock/b/paf.js", $:'$prototype'})
        }).toThrow()
    })
    
    it("Should bind explicit unique definition", function() {
        var r = knit.parse({bar:"../test-mock/b/foo.js", $:'$unique'})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$unique')
        expect(r._.toString()).toEqual(function() { return knit(r) }.toString())
        expect(r._.r.toString()).toEqual(function() {
    return {foo:c++, common:"same"}
}.toString())
    })
    
    it("Should bind with immediate object binding", function() {
        var r = knit.parse({bar:{foo:0, common:"same"}})
        expect(r).toEqual({
            k: 'bar',
            $: '$unique',
            _: {foo:0, common:"same"}
        })
    })
    
    it("Should bind with immediate object binding and short explicit scope definition", function() {
        var r = knit.parse({bar:{foo:0, common:"same"}, $:'!'})
        expect(r).toEqual({
            k: 'bar',
            $: '$unique',
            _: {foo:0, common:"same"}
        })
    })
    
    it("Should bind with immediate object binding and long explicit scope definition", function() {
        var r = knit.parse({bar:{foo:0, common:"same"}, $:'$unique'})
        expect(r).toEqual({
            k: 'bar',
            $: '$unique',
            _: {foo:0, common:"same"}
        })
    })
    
    it("Should bind with immediate object binding and short explicit scope definition", function() {
        expect(function() { 
            knit.parse({bar:{foo:0, common:"same"}, $:'@'})
        }).toThrow()
    })
    
    it("Should bind with immediate object binding and long explicit scope definition", function() {
        expect(function() { 
            knit.parse({bar:{foo:0, common:"same"}, $:'$prototype'})
        }).toThrow()
    })
    
    it("Should bind with immediate string binding implicit definition", function() {
        var r = knit.parse({bar:"barbar"})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$unique')
        expect(r._).toEqual("barbar")
    })
    
    it("Should bind with immediate string binding long definition", function() {
        var r = knit.parse({bar:"barbar", $:'$unique'})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$unique')
        expect(r._).toEqual("barbar")
    })
    
    it("Should bind with immediate string binding short definition", function() {
        var r = knit.parse({bar:"barbar", $:'!'})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$unique')
        expect(r._).toEqual("barbar")
    })
    
    it("Should bind with immediate string containing escaped '/' binding explicit definition", function() {
        var r = knit.parse({bar:"barbar / conan", $:'!'})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$unique')
        expect(r._).toEqual("barbar / conan")
    })
    
    it("Should fail binding with immediate string containing escaped '/' binding implicit definition", function() {
        expect(function() {
            knit.parse({bar:"barbar / conan"})
        }).toThrow()
    })
    
    it("Should fail binding with immediate string for prototype long definition", function() {
        expect(function() {
            knit.parse({bar:"barbar", $:'$prototype'})
        }).toThrow()
    })
    
    it("Should fail binding with immediate string for prototype short definition", function() {
        expect(function() {
            knit.parse({bar:"barbar", $:'@'})
        }).toThrow()
    })
    
    it("Should bind with immediate function binding implicit definition", function() {
        var r = knit.parse({bar:function(foo) {
    return {foo:foo, common:"same"}
}})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {foo:foo, common:"same"}
}.toString())
    })
    
    it("Should bind with immediate function binding explicit prototype definition", function() {
        var r = knit.parse({$:'$prototype',bar:function(foo) {
    return {foo:foo, common:"same"}
}})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {foo:foo, common:"same"}
}.toString())
    })
    
    it("Should bind with immediate function binding explicit prototype definition", function() {
        var r = knit.parse({$:'$unique',bar:function(foo) {
    return {foo:foo, common:"same"}
}})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$unique')
        expect(r._.toString()).toEqual(function() { return knit(r) }.toString())
        expect(r._.r.toString()).toEqual(function(foo) {
    return {foo:foo, common:"same"}
}.toString())
    })

    it("Should bind $unique with explicit dependencies definition", function() {
        var r = knit.parse({plop: "../test-mock/b/plop.js", $:'!', _:[
            {a: "../test-mock/b/no_a.js"}
        ]})
        expect(r.k).toEqual('plop')
        expect(r.$).toEqual('$unique')
        expect(r._.toString()).toEqual(function() { return kn.knit(r) }.toString())
        expect(r._.r.toString()).toEqual(function(a) {
    return {plop: "plip",a:a}
}.toString())
        expect(r._.knit.cfg.a._.toString()).toEqual(require("../test-mock/b/no_a.js").toString())
    })
})
