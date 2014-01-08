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
    fs = require('fs');

    // retrieve caller module context 
    var caller_dir = path.dirname(module.parent.filename)
    
    function parse(e) {
        switch (typeof e) {
        case 'string':
            //console.log("Start scanning",e)
        
            // e contains some /
            if (e.indexOf(path.sep)!==-1) {
                // e ends with /, hence it is a folder 
                if (e.lastIndexOf(path.sep) === e.length-1) {
                    var d = path.resolve(caller_dir,e)
                    var c = fs.readdirSync(d)
                    c = c.map(function(o) {return e+o})
                    return c.map(parse)
                } else {
                    if (fs.existsSync(path.resolve(caller_dir,e))) {
                        var b = path.basename(e,'.js') 
                        var r = require(e);
                        return {k:b, $: (typeof r === 'function' ? '$prototype' : '$unique'), _: r }
                    }
                }
            } else {
                //TODO : try require and inspect
            }
        case 'object':
            var res = {}, v, dep
            for (var u in e) {
                switch (u) {
                case '$':
                case '$scope':
                    switch (e[u]) {
                    case '$unique':
                    case '$prototype':
                        res.$ = e[u]
                        break;
                    default:
                        res.k=u
                        v = e[u]
                        break;
                    }
                    break;
                case '_':
                case '$dependendies':
                    if (typeof e[u] === 'object' && e[u] instanceof Array) {
                        dep = e[u]
                    } else {
                        res.k=u
                        v = e[u]
                    }
                    break;
                default:
                    res.k=u
                    v = e[u]
                }
            }
            
            if (v.indexOf(path.sep)!==-1 && fs.existsSync(path.resolve(caller_dir,v))) {
                var r = require(v);
                if ('$' in res) {
                    switch (res.$) {
                    case '$prototype':
                        if (typeof r === 'function') {
                            res._ = r
                        } else {
                            
                        }
                        break;
                    case '$unique':
                        if (typeof r === 'function') {
                            if (typeof dep !== 'undefined') {
                                dep.push(r)
                                res._ = parse.apply(null, dep)
                            } else {
                                res._ = knit(r)
                            }
                        }
                        break;
                    }
                } else {
                    res.$ = typeof r === 'function' ? '$prototype' : '$unique'
                    res._ = r
                } 
            } else {
                //TODO : try require and inspect
            }
            
            return res
        case 'function':
        
            
        }
    }
    
    
    function Config () {
        this.cfg = {}
    }
    Config.prototype.add = function(c) {
        var r = parse(c)
        this.cfg[r.k]=r
    }
    Config.prototype.get = function(k) {
        return this.cfg[k]
    }
    Config.prototype.inject = function(f) {
        return
    }
    

	/**
	 * Exported as singleton
	 */
	function Knit() {
		var config = new Config(this)
		this.config = function(conf) {
			config.parse(conf)
			return this
		}
		this.inject = function(cb, chain, into) {
			var required = []
			ku.scan_fun(cb,function (_0,_1,_2) {
				_2.split(/\s*,\s*/).forEach(function(e) { required.push(e) })
			})	
			var arg = []
			required.forEach(function (e) { arg.push(config.get(e)) })
			var res
			if (typeof into === 'function') res = into(cb,arg)
			else res = cb.apply(null,arg)
			if (chain) return this
			return res
		}
		this.clean = function(arr) {
			if (typeof arr === 'object' && arr instanceof Array) {			
				arr.forEach(function(u) {delete options[u]})
			} else {
				for (u in options) delete options[u]
			}
			return this
		}
		this.clone = function(x) {
			// basic clone, this do not work in every case :(
			return JSON.parse(JSON.stringify(x))
		}
		this.showConfig = function () {
			return config.toString()
		}
	}
    
	/**
	 * Singleton export of Knit
	 */
     
     
    var config = new Config(knit)
	    
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
                    if (e instanceof Array) {
                        e[e.length-1]
                        var c = new Config()
                        
                    }
                
                case 'function':
                    return config.inject(e)
                       
                default:
                    throw new Error("Invalid argument: "+e)
                
            }
        default:
            //Array.prototype.slice.apply(arguments).forEach(knit)
            return
            
        }
    }
    
    knit.parse=parse
    
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
