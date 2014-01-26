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

describe("Parse single config:", function() {
    it("Should parse string resolving a file", function() {
        var r = knit.parse("../test-mock/b/foo.js")
        expect(r.k).toEqual('foo')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function() {
    return {foo:c++, common:"same"}
}.toString())
    })
    
    it("Should parse string resolving a folder ending by /", function() {
        var r = knit.parse("../test-mock/a/")
        expect(r.length).toEqual(3)
        expect(r[0].k).toEqual('a')
        expect(r[0].$).toEqual('$prototype')
        expect(r[0]._.toString()).toEqual(function() {
    return {a:"local and no deps", c:c++}
}.toString())
        expect(r[1].k).toEqual('b')
        expect(r[1].$).toEqual('$prototype')
        expect(r[1]._.toString()).toEqual(function(a) {
    return {b: "mine",a:a}
}.toString())
        expect(r[2].k).toEqual('c')
        expect(r[2].$).toEqual('$prototype')
        expect(r[2]._.toString()).toEqual(function() {
    return {x:"local and no deps", c:c++}
}.toString())
    })
    
    it("Should parse string resolving a folder not ending by /", function() {
        var r = knit.parse("../test-mock/a")
        expect(r.length).toEqual(3)
        expect(r[0].k).toEqual('a')
        expect(r[0].$).toEqual('$prototype')
        expect(r[0]._.toString()).toEqual(function() {
    return {a:"local and no deps", c:c++}
}.toString())
        expect(r[1].k).toEqual('b')
        expect(r[1].$).toEqual('$prototype')
        expect(r[1]._.toString()).toEqual(function(a) {
    return {b: "mine",a:a}
}.toString())
        expect(r[2].k).toEqual('c')
        expect(r[2].$).toEqual('$prototype')
        expect(r[2]._.toString()).toEqual(function() {
    return {x:"local and no deps", c:c++}
}.toString())
    })
    
    it("Should fail parsing a string definition with not existing file", function() {
        expect(function() { knit.parse("../test-mock/b/paf.js") }).toThrow()
    })
    
    it("Should fail parsing a string definition with not existing folder", function() {
        expect(function() { knit.parse("../test-mock/c/") }).toThrow()
    })

    it("Should parse string resolving a module", function() {
        var r = knit.parse('fs')
        expect(r.k).toEqual('fs')
        expect(r.$).toEqual('$unique')
        expect(r._).toEqual(require('fs'))
    })
    
    it("Should fail parsing a string definition with not existing module", function() {
        expect(function() { knit.parse("plop") }).toThrow()
    })
    
    it("Should parse an object implicit prototype definition", function() {
        var r = knit.parse({foo:"../test-mock/b/bar.js"})
        expect(r.k).toEqual('foo')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {bar:c++, foo:foo, common:"same"}
}.toString())
    })
    
    it("Should parse an object implicit definition to $", function() {
        var r = knit.parse({$:"../test-mock/b/bar.js"})
        expect(r.k).toEqual('$')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {bar:c++, foo:foo, common:"same"}
}.toString())
    })
    
    it("Should parse an object explicit prototype definition", function() {
        var r = knit.parse({foo:"../test-mock/b/bar.js", $:'$prototype'})
        expect(r.k).toEqual('foo')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {bar:c++, foo:foo, common:"same"}
}.toString())
    })
    
    it("Should fail parsing an object explicit prototype definition with not existing file", function() {
        expect(function() { 
            knit.parse({foo:"../test-mock/b/paf.js", $:'$prototype'})
        }).toThrow()
    })
    
    xit("Should parse an object explicit unique definition", function() {
        var r = knit.parse({bar:"../test-mock/b/foo.js", $:'$unique'})
        expect(r).toEqual({
            k: 'bar',
            $: '$unique',
            _: {foo:0, common:"same"}
        })
    })
    
    xit("Should parse an object with immediate object binding", function() {
        var r = knit.parse({bar:{foo:0, common:"same"}})
        expect(r).toEqual({
            k: 'bar',
            $: '$unique',
            _: {foo:0, common:"same"}
        })
    })
    
    xit("Should parse an object with immediate function binding", function() {
        var r = knit.parse({bar:function(foo) {
    return {foo:foo, common:"same"}
}})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function(foo) {
    return {foo:foo, common:"same"}
}.toString())
    })
    
    xit("Should parse an object with immediate string binding", function() {
        var r = knit.parse({bar:"barbar", $:'='})
        expect(r.k).toEqual('bar')
        expect(r.$).toEqual('$unique')
        expect(r._).toEqual("barbar")
    })
    
    it("Should parse an array of simple definition", function() {
        var r = knit.parse(["../test-mock/b/foo.js", "../test-mock/a/", {bar:"../test-mock/b/foo.js", $:'$prototype'}])
        expect(r.length).toEqual(5)
        var i = 0
        expect(r[i].k).toEqual('foo')
        expect(r[i].$).toEqual('$prototype')
        expect(r[i]._.toString()).toEqual(function() {
    return {foo:c++, common:"same"}
}.toString())
        i++
        expect(r[i].k).toEqual('a')
        expect(r[i].$).toEqual('$prototype')
        expect(r[i]._.toString()).toEqual(function() {
    return {a:"local and no deps", c:c++}
}.toString())
        i++
        expect(r[i].k).toEqual('b')
        expect(r[i].$).toEqual('$prototype')
        expect(r[i]._.toString()).toEqual(function(a) {
    return {b: "mine",a:a}
}.toString())
        i++
        expect(r[i].k).toEqual('c')
        expect(r[i].$).toEqual('$prototype')
        expect(r[i]._.toString()).toEqual(function() {
    return {x:"local and no deps", c:c++}
}.toString())
        i++
        expect(r[i].k).toEqual('bar')
        expect(r[i].$).toEqual('$prototype')
        expect(r[i]._.toString()).toEqual(function() {
    return {foo:c++, common:"same"}
}.toString())
    })
    
    it("Should fail parsing an array containing a function not àt the last element", function() {
        expect(function() { 
            knit.parse(['foo',function(){}, 'plop'])
        }).toThrow()
    })
})