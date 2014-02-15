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
 * container to implements node/browser compatible module
 */
(function (publish,require) {
    "use strict"
    
    var
    path = require('path'),
    fs = require('fs')

    var funRx = /function\s+(\w*)\s*\((.*?)\)/
    function scanfun(fun,cb) { return fun.toString().replace(funRx, cb) }

    function parse(e) {
        //console.log("Start scanning",e)
        switch (typeof e) {
        case 'string':
            return parse_string(e)
        case 'object':
            if (e instanceof Array) {
                return e.map(parse).reduce(flatten)
            } else {                
                return parse_object(e)
            }
        case 'function':
            scanfun(e, function(_0,_1) {
                if (_1.length>0) build(_1,e)
                else throw new Error("Cannot parse function without a name.")
            })
        }
    }

    // retrieve caller module context 
    var caller_dir = path.dirname(module.parent.filename)
    
    // util functions
    function isProto(r) { return typeof r === 'function' ? '$prototype' : '$unique' }    
    function build(k,_,$) { return {k:k, $: ($ ? $ : isProto(_)), _: _ } }
    var jsRx = /\.js$/
    function flatten(prev, curr, i) {
        if (i==1) prev = flatten([], prev, 0)
        if (curr instanceof Array) {
            Array.prototype.push.apply(prev,curr)
        } else {
            prev.push(curr)
        }
        return prev
    }
    function parse_string(e) {
        // e contains some /, we try to retrieve the modules
        if (e.indexOf(path.sep)!==-1) {
            var d = path.resolve(caller_dir,e)
            if (fs.lstatSync(d).isDirectory()) {
                return fs.readdirSync(d)
                .map(function(o) {return e+path.sep+o})
                .map(parse_string)
                .reduce(flatten)
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
                    var r = parse_string(caller_dir).filter(function (f) { return f.k === e })
                    if (r.length >0) return r[0] 
                }
                throw x
            }
        }
    }
    
    function parse_object(e) {
        var k, $, _, dep

        for (var u in e) {
            var v = e[u]
            if ((u === '$' || u === '$scope') && (['$unique','=','$prototype','@'].indexOf(v) !== -1)) {
                $ = (v === '=' ? '$unique' : (v === '@' ? '$prototype' : v))
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
                _ = parse_object_r(r,$,dep)
            } else {
                try {
                    var r = parse_string(_)._
                    _ = parse_object_r(r,$,dep)
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
                _ = parse_object_lazy_binding(_, dep)
            }
            break;
        }
            
        return build(k,_,$)
    }
    
    function parse_object_r(r,$,dep) {
        if (typeof $ !== 'undefined') {
            switch ($) {
            case '$prototype':
                if (typeof r === 'function') {
                    return r
                } else {
                    throw new Error("Cannot bind prototype from an object") 
                }
            case '$unique':
                if (typeof r === 'function') {
                    return parse_object_lazy_binding(r, dep)
                } else {
                    return r
                }
            }
        } else {
            return r
        }
    }
    
    function parse_object_lazy_binding(r, dep) {
        if (typeof dep !== 'undefined') {
            dep.push(r)
            return parse.apply(null, dep)
        } else {
            var _ = function() { return knit(r) }
            _.r = r
            return _
        }
    }
    
    function Config() { this.cfg = {} }
    Config.prototype.add = function(c) { this.set(parse(c)) }
    Config.prototype.set = function(r) { this.cfg[r.k] = r }
    Config.prototype.get = function(k) { return this.cfg[k] }
    Config.prototype.inject = function(k) {
        if (!(k in this.cfg)) { this.add(k) }
        var i = this.cfg[k]
        if (i.$ == '$unique') {
            return i._
        } else {
            return knit(i._)
        }
    }
    Config.prototype.asJson = function() { return this.cfg }
    
    var config = new Config();
  
    var knit = function () {
        switch (arguments.length) {
        case 0:
            return config.asJson()
            
        case 1:
            var e = arguments[0]
            switch (typeof e) {
                case 'string':
                    return config.get(e)
                
                case 'object':
                    config.add(e)
                    return
                
                case 'function':
                    var required = []
                    scanfun(e,function (_0,_1,_2) {
                        _2.split(/\s*,\s*/).forEach(function(p) { if (p) required.push(p) })
                    })
                    var args = required.map(config.inject.bind(config))
                    return e.apply(null,args)
                       
                default:
                    throw new Error("Invalid argument: "+e)
                
            }
        default:
            var p = parse(Array.prototype.slice.apply(arguments))
            p.forEach(config.set.bind(config))
        }
    }
    
    knit.parse=parse
    knit.util = {}
    knit.util.flatten = flatten
    
    
    publish(knit)

})
(/**
 * The publish method that detects context and actualy publish Knit
 */		
function (knit) {
	if (typeof module !== 'undefined') {
		module.exports = knit
	} else {
		this['knit']=knit
	}
},
/**
 * 
 */
typeof require !== 'undefined' ? require : function(k) { return this['knit'] }
)
