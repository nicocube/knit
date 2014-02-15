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

var Binder = require("./knit-binder.js")
    
/**
 * Container for configuration of the knit instance
 */
function Config (knit) {
    var _config = {knit:knit}
    this.add = function (k,v) {
        _config[k]=v
        return v
    }
    this.get = function (k) {
        var x = _config[k]
        if (typeof x === 'undefined' && k !== '') {
            var v,m,z,o
            try {
                v = require(k)
            } catch(e) {
                here:
                for (var i = 0; i < _known.length; i++) {
                    try {
                        z = _stack.length>0 ? '/'+ _stack.join('/node_modules/')+'/node_modules':''
                        m = _known[i]+z+'/'+k
                        o = _stack.pop()
                        if (typeof o !== 'undefined' && o !== k) _stack.push(o)
                        _stack.push(k)							
                        v = require(m) // will throw if 
                        _known.push(m+'/node_modules')
                        _stack.pop()
                        break here;
                    } catch(e) {
                        //console.error(e)
                        _stack.pop()
                        continue
                    }
                }
                if (!v) console.warn("%s not found",k)
            }
            x = this.add(k, v)
        }
        if (x instanceof Binder) return x.get()
        else return x
    }
    this.parse = function (conf) {
        switch (typeof conf) {
        case 'string':
            // find a file to load js or json
            break
        case 'function': 
            var that = this
            conf(function (k) {
                switch (typeof k) {
                case 'string':
                    return that.add(k, new Binder(knit))
                case 'function':
                    var b = new Binder(knit).is('constructor')
                    ku.scan_fun(k, function(_0,_1,_2) {
                        if (_1.length>0) that.add(_1,b.to(k))
                        else b=undefined
                    })
                    return b
                default:
                }
            })
            break
        case 'object':			
            for (var k in conf)
                this.add(k, conf[k])
            break
        }
    }
    this.toString = function () {
        var str = '{\n'
        for (var u in _config) {
            str += ' ' +u + ': ' + ku.asString(_config[u]) + ',\n'
        }
        str.substring(0,str.length-1)
        str += '}'
        return str
    }
}
