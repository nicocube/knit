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
            // e contains some /
            if (e.indexOf(path.sep)!==-1) {
                // e ends with /, hence it is a folder 
                if (e.lastIndexOf(path.sep) === e.length-1) {
                    var d = path.resolve(caller_dir,e)
                    //console.log("Start scanning",d)
                    var c = fs.readdirSync(d)
                    c = c.map(function(o) {return e+o})
                    //console.log(c)
                    return c.map(parse)
                } else {
                    var d = path.dirname(e)
                    var b = path.basename(e,'.js')                    
                    return {k:b, $:'prototype', $req: e}
                }
            } else {
                //TODO : try require and inspect
            }
        case 'object':
            
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
