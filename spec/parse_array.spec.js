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

describe("Parse array config:", function() {    
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
