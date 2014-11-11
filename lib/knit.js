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
	} else {
        // TODO : browser context
        //		this['knit'] = exporter(require)
	}
})
(function (require, path, fs) {
    "use strict"

    // retrieve caller module context 
    var caller_dir = path.dirname(module.parent.filename)
    
    var __knit_path = '__knit_path'
    
    function Knit() {
        this.cfg = {}
        this.stack = []
    }
    Knit.prototype = new Object()
    Knit.prototype.add = function(c) { this.set(this.parse(c)) }
    Knit.prototype.set = function(r) { this.cfg[r.k] = r }
    Knit.prototype.get = function(k) { return this.cfg[k] || ('parent' in this ? this.parent.get(k) : undefined) }
    Knit.prototype.data = function() { return this.cfg }
    Knit.prototype.inherit = function (cfg) { this.parent = cfg }
    Knit.prototype.scanfun = function(fun,cb) { return fun.toString().replace(funRx, cb) }
    Knit.prototype.inject = function(k) {
        var r
        this.stack.push(k)
        if (!(k in this.cfg)) { this.add(k) }
        var i = this.cfg[k]
        if (i.$ === '$asis' || i.$ === '$require') {
            r = i._
        } else if (i.$ === '$unique') {
            if (typeof i._ === 'function' && !i.isInstantiated) {
                i.isInstantiated = true
                i._ = this.knit(i._)
            }
            r = i._
        } else {
            r = this.knit(i._)
        }
        this.stack.pop()
        return r
    }
    Knit.prototype.config = function (cfg) {
        if (cfg instanceof Array) {
            cfg.forEach(function (c) {
                var r = this.parse(c)
                if (r instanceof Array) {
                    r.forEach(Knit.prototype.set.bind(this))
                } else {              
                    this.set(r)
                } 
            }.bind(this))
        } else {            
            this.parse(cfg).forEach(Knit.prototype.set.bind(this))
        }
    }
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
    Knit.prototype.parse_string = function (e, search) {
        // e contains some /, we try to retrieve the modules
        if (e.indexOf(path.sep)!==-1) {
            var d = path.resolve(caller_dir,e)
            this.checkPath(d, function (v, knitPath) {
                if (v) {
                    throw new Error("Path '"+d+"' not in ["+knitPath._.map(function(p) {return path.resolve(caller_dir, p)}).join(', ')+"]")
                }
            })
            if (fs.lstatSync(d).isDirectory() && path.basename(d) !== 'node_modules') {
                return fs.readdirSync(d)
                .map(function(o) {return path.resolve(d,o)})
                .map(function(o) {return this.parse_string(o, search)}.bind(this))
                .reduce(flatten,[])
            } else if (d.match(jsRx)) {
                if (typeof search === 'undefined') {                    
                    return build(path.basename(d,'.js'), require(d))
                } else {
                    var k = path.basename(d,'.js')
                    if (k === search) {
                        return build(k, require(d))
                    } else {
                        return []
                    }
                }
            } else {
                return []
            }
        } else {
            try {
                return build(e,require(e))
            } catch (x) {
                if (x.code === 'MODULE_NOT_FOUND') {
                    var r = this.checkPath(caller_dir, function (v, knitPath) {
                        if (v) {
                            return knitPath._.map(function (p) {
                                return this.parse_string(path.resolve(caller_dir, p), e)
                            }.bind(this)).
                            reduce(flatten,[])
                        } else {
                            return this.parse_string(caller_dir, e)
                        }
                    }.bind(this))
                    if (r.length > 0) return r[0] 
                }
                x.message = "While injecting "+this.stack.join('->')+": "+x.message
                throw x
            }
        }
    }
    Knit.prototype.checkPath = function (d, cb) {
        var knitPath = this.get(__knit_path)
        return cb(
            typeof knitPath !== 'undefined' &&
            '_' in knitPath && knitPath._ instanceof Array &&
            ! knitPath._.every(function (p) { return d.indexOf(path.resolve(caller_dir,p)) !== -1 })
        ,
            knitPath
        )
    }
    Knit.prototype.parse_object = function (e) {
        var k, $, _, dep

        for (var u in e) {
            var v = e[u]
            if ((u === '$' || u === '$scope') && (['$unique','!','$prototype','@','$asis','=','$require','&'].indexOf(v) !== -1)) {
                $ = (v === '!' ? '$unique' : (v === '@' ? '$prototype' : (v === '=' ? '$asis' : (v === '&' ? '$require' : v))))
            } else if ((u === '_' || u === '$name') && typeof v === 'string') {
                k=v
                _=v
            } else if ((u === '$$' || u === '$dependendies') && typeof v === 'object' && v instanceof Array) {
                dep = v
            } else {
                k=u
                _=v
            }
        }
        
        switch (typeof _) {
        case 'string':
            if ($ === '$asis') {
                // do nothing
            } else if (_.indexOf(path.sep)!==-1 && fs.existsSync(path.resolve(caller_dir,_))) {
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
            case '$require':
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
    function isProto(r, k) {
        if (typeof r === 'function') {
            var res = funRx.exec(r)
            if (res !== null && res[1] === k) {
                return '$require'
            } else {
                return '$prototype'
            }
        }
        return '$unique'
    }    
    function build(k,_,$) { return {k:k, $: ($ ? $ : isProto(_, k)), _: _ } }
    
    var funRx = /function\s+(\w*)\s*\((.*?)\)/
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
    knit.K = K
    knit.parse = Knit.prototype.parse.bind(new Knit())
    knit.util = {}
    knit.util.flatten = flatten
    
    return knit
//    return Knit.prototype.knit.bind(new Knit())

})
