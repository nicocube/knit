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

    function parse(e) {
        //console.log("Start scanning",e)
        switch (typeof e) {
        case 'string':
            return parse_string(e)
        case 'object':
            if (e instanceof Array) {
                return parse_array(e)
            } else {                
                return parse_object(e)
            }
        case 'function':
            
        }
    }

    // retrieve caller module context 
    var caller_dir = path.dirname(module.parent.filename)
    
    // util functions
    function isProto(r) { return typeof r === 'function' ? '$prototype' : '$unique' }    
    function build(k,_,$) { return {k:k, $: ($ ? $ : isProto(_)), _: _ } }
    var rx = /\.js$/
    function flatten(prev, curr) {
        if (! (prev instanceof Array)) {
            prev = [prev]
        }
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
            } else if (e.match(rx)) {
                return build(path.basename(e,'.js'), require(e))
            } else {
                return []
            }
        } else {
            return build(e,require(e))
        }
    }
    
    function parse_object(e) {
        var k, $, _, dep

        for (var u in e) {
            var v = e[u]
            if ((u === '$' || u === '$scope') && (v === '$unique' || v === '$prototype')) {
                $ = v
            } else if ((u === '_' || u === '$dependendies') && typeof v === 'object' && v instanceof Array) {
                dep = v
            } else {
                k=u
                _=v
            }
        }
        
        if (_.indexOf(path.sep)!==-1 && fs.existsSync(path.resolve(caller_dir,_))) {
            var r = require(_);
            if (typeof $ !== 'undefined') {
                switch ($) {
                case '$prototype':
                    if (typeof r === 'function') {
                        _ = r
                    } else {
                        
                    }
                    break;
                case '$unique':
                    if (typeof r === 'function') {
                        if (typeof dep !== 'undefined') {
                            dep.push(r)
                            _ = parse.apply(null, dep)
                        } else {
                            _ = knit(r)
                        }
                    }
                    break;
                }
            } else {
                _ = r
            } 
        } else {
            return parse_string(v)
        }
        
        return build(k,_,$)
    }
    
    function parse_array(e) {
        return e.map(parse).reduce(flatten)
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
