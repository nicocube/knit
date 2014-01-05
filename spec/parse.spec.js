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
    it("Should parse string resolving a script", function() {
        var r = knit.parse("../test-mock/b/foo.js")
        expect(r).toEqual({
            k: 'foo',
            $: 'prototype',
            $req: "../test-mock/b/foo.js"
        })
    })
    it("Should parse string resolving a folder", function() {
        var r = knit.parse("../test-mock/a/")
        expect(r).toEqual([
            { k: 'a', $: 'prototype', $req: "../test-mock/a/a.js" },
            { k: 'b', $: 'prototype', $req: "../test-mock/a/b.js" }
        ])
    })
    
    it("Should parse an object prototype definition", function() {
        var r = knit.parse({foo:"../test-mock/b/bar.js"})
        expect(r).toEqual({
            k: 'foo',
            $: 'prototype',
            $req: "../test-mock/b/bar.js"
        })
    })
    
    it("Should parse an object static definition", function() {
        var r = knit.parse({bar:"../test-mock/b/foo.js"})
        expect(r).toEqual({
            k: 'bar',
            $: 'unique',
            $req: "../test-mock/b/foo.js"
        })
    })
})
