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

describe("Parse string config:", function() {
    it("Should resolve an implicitly colocated script", function() {
        var r = knit.parse("x")
        expect(r.k).toEqual('x')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function() {
    return {x:"local and no deps", c:c++}
}.toString())
    })

    it("Should resolve a file", function() {
        var r = knit.parse("../test-mock/b/foo.js")
        expect(r.k).toEqual('foo')
        expect(r.$).toEqual('$prototype')
        expect(r._.toString()).toEqual(function() {
    return {foo:c++, common:"same"}
}.toString())
    })
    
    it("Should resolve a folder ending by /", function() {
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
    
    it("Should resolve a folder not ending by /", function() {
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
    
    it("Should fail with not existing file", function() {
        expect(function() { knit.parse("../test-mock/b/paf.js") }).toThrow()
    })
    
    it("Should fail with not existing folder", function() {
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
})
