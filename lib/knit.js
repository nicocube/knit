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

(/**
 * The publish method that detects context and actualy publish Knit
 */	
function (exporter) {
	if (typeof module !== 'undefined') {
        // NodeJS Context: inject and export
        module.exports = exporter(require, require('path'), require('fs'))
        //console.log(module.exports)
	} else {
        // TODO : browser context
        //		this['knit'] = exporter(require)
	}
})
(function (require, path, fs) {
    "use strict"

    // retrieve caller module context 
    var caller_dir = path.dirname(module.parent.filename)
    
    function Knit() {
        this.funRx = /function\s+(\w*)\s*\((.*?)\)/
        this.cfg = {} 
    }
    Knit.prototype = new Object()
    Knit.prototype.add = function(c) { this.set(this.parse(c)) }
    Knit.prototype.set = function(r) { this.cfg[r.k] = r }
    Knit.prototype.get = function(k) { return this.cfg[k] || ('parent' in this ? this.parent.get(k) : undefined) }
    Knit.prototype.data = function() { return this.cfg }
    Knit.prototype.inherit = function (cfg) { this.parent = cfg }
    Knit.prototype.scanfun = function(fun,cb) { return fun.toString().replace(this.funRx, cb) }
    Knit.prototype.inject = function(k) {
        if (!(k in this.cfg)) { this.add(k) }
        var i = this.cfg[k]
        if (i.$ == '$asis') {
            return i._
        }
        else if (i.$ == '$unique') {
            if (typeof i._ === 'function') {
                i._ = this.knit(i._)
            }
            return i._
        } else {
            return this.knit(i._)
        }
    }
    Knit.prototype.config = function (cfg) { this.parse(cfg).forEach(Knit.prototype.set.bind(this)) }
    Knit.prototype.knit = function () {        
        switch (arguments.length) {
        case 0:
            return this.data()
        case 1:
            var e = arguments[0]
            switch (typeof e) {
                case 'string':
                    return this.get(e)
                
                case 'object':
                    this.add(e)
                    return
                
                case 'function':
                    var required = []
                    this.scanfun(e,function (_0,_1,_2) {
                        _2.split(/\s*,\s*/).forEach(function(p) { if (p) required.push(p) })
                    })
                    var args = required.map(Knit.prototype.inject.bind(this))
                    return e.apply(null,args)
                       
                default:
                    throw new Error("Invalid argument: "+e)
                
            }
        default:
            this.config(Array.prototype.slice.apply(arguments))
        }
    }
    Knit.prototype.parse = function (e) {
        switch (typeof e) {
        case 'string':
            return this.parse_string(e)
        case 'object':
            if (e instanceof Array) {
                return e.map(Knit.prototype.parse.bind(this)).reduce(flatten, [])
            } else {                
                return this.parse_object(e)
            }
        case 'function':
            var res
            this.scanfun(e, function(_0,_1) {
                if (_1.length > 0) res = build(_1,e)
                else throw new Error("Cannot parse function without a name.")
            })
            return res
        }
    }
    Knit.prototype.parse_string = function (e) {
        // e contains some /, we try to retrieve the modules
        if (e.indexOf(path.sep)!==-1) {
            var d = path.resolve(caller_dir,e)
            if (fs.lstatSync(d).isDirectory() && path.basename(d) !== 'node_modules') {
                return fs.readdirSync(d)
                .map(function(o) {return e+path.sep+o})
                .map(Knit.prototype.parse_string.bind(this))
                .reduce(flatten,[])
            } else if (e.match(jsRx)) {
                return build(path.basename(e,'.js'), require(e))
            } else {
                return []
            }
        } else {
            try {
                return build(e,require(e))
            } catch (x) {
                if (x.code === 'MODULE_NOT_FOUND') {
                    var r = this.parse_string(caller_dir).filter(function (f) { return f.k === e })
                    if (r.length >0) return r[0] 
                }
                throw x
            }
        }
    }    
    Knit.prototype.parse_object = function (e) {
        var k, $, _, dep

        for (var u in e) {
            var v = e[u]
            if ((u === '$' || u === '$scope') && (['$unique','!','$prototype','@','$asis','='].indexOf(v) !== -1)) {
                $ = (v === '!' ? '$unique' : (v === '@' ? '$prototype' : (v === '=' ? '$asis' : v)))
            } else if ((u === '_' || u === '$dependendies') && typeof v === 'object' && v instanceof Array) {
                dep = v
            } else {
                k=u
                _=v
            }
        }
        
        switch (typeof _) {
        case 'string':
            if (_.indexOf(path.sep)!==-1 && fs.existsSync(path.resolve(caller_dir,_))) {
                var r = require(_)
                _ = this.parse_object_r(r,$,dep)
            } else {
                try {
                    var r = this.parse_string(_)._
                    _ = this.parse_object_r(r,$,dep)
                } catch(e) {
                    if (! (e.code === 'MODULE_NOT_FOUND' && (typeof $ === 'undefined' || $ === '$unique') )
                    &&  ! (e.code === 'ENOENT' && e.errno === 34 && $ === '$unique')
                    ) {
                        throw e
                    }
                }
            }
            break;
        case 'object':
            if ($ === '$prototype') {
                throw new Error("Cannot bind prototype from an object") 
            }
            break;
        case 'function':
            if ($ === '$unique') {
                _ = this.parse_object_lazy_binding(_, dep)
            }
            break;
        }
        return build(k,_,$)
    }
    Knit.prototype.parse_object_r = function (r,$,dep) {
        if (typeof $ !== 'undefined') {
            switch ($) {
            case '$asis':
                return r
            case '$prototype':
                if (typeof r === 'function') {
                    return r
                } else {
                    throw new Error("Cannot bind prototype from an object") 
                }
            case '$unique':
                if (typeof r === 'function') {
                    return this.parse_object_lazy_binding(r, dep)
                } else {
                    return r
                }
            }
        } else {
            return r
        }
    }
    
    Knit.prototype.parse_object_lazy_binding = function (r, dep) {
        var _
        if (typeof dep !== 'undefined') {
            var kn = new Knit()
            kn.inherit(this)
            kn.config(dep)
            _ = function() { return kn.knit(r) }
            _.knit = kn
        } else {
            _ = function() { return knit(r) }
            _.knit = this
        }
        _.r = r
        return _
    }
    
    // util functions
    function isProto(r) { return typeof r === 'function' ? '$prototype' : '$unique' }    
    function build(k,_,$) { return {k:k, $: ($ ? $ : isProto(_)), _: _ } }
    var jsRx = /\.js$/
    function flatten(prev, curr, i) {
        if (curr instanceof Array) {
            Array.prototype.push.apply(prev,curr)
        } else {
            prev.push(curr)
        }
        return prev
    }

    var K = new Knit()
    var knit = Knit.prototype.knit.bind(K)
    K.set({k: 'knit', $: '$asis', _: knit})
    knit.parse = Knit.prototype.parse.bind(new Knit())
    knit.util = {}
    knit.util.flatten = flatten
    
    return knit
//    return Knit.prototype.knit.bind(new Knit())

})
