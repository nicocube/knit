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

describe("Parse function config:", function() {
    it("", function () {
        var r = knit.parse(function plop () {})
        expect(r.k).toEqual('plop')
        expect(r.$).toEqual('$unique')
        expect(r._.toString()).toEqual(function plop () {}.toString())
    })
    
    it("should fail if ", function () {
        expect(function() { 
            knit.parse(function(){})
        }).toThrow()
    })
})
