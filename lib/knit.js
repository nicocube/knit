/*
 * Copyright 2012 Nicolas Lochet Licensed under the Apache License, Version 2.0 (the "License");
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
	// yes use it, be strict !! 
    "use strict";
	
    // function scanning
    var rx = /function\s+(\w*)\s*\((.*?)\)/;
    function scan_fun(fun,cb) {    	
    	fun.toString().replace(rx, cb);
    }

	/**
	 * Smart Container that enable different kind of injection
	 */
	function Binder(knit) {
		var _to=null , _kind=null;	
		this.to = function (s) {
			// no parameter-like call return value
			if (typeof s === 'undefined') return _to;
			_to = s;
			return this;
		};
		this.is = function (s) {
			// no parameter-like call return value
			if (typeof s === 'undefined') return typeof _kind === 'string' ? _kind :'singleton';
			_kind = s;
			return this;
		};
		this.get = function () {
			switch(this.is()) {
			case 'clone':
				// ask knit to clone
				return knit.clone(this.to());
				break;
			case 'builder':
				return knit.inject(this.to());
				break;
			case 'constructor':
				return knit.inject(this.to(), false, function (constructor, args) {
				    function F() {
				        return constructor.apply(this, args);
				    }
				    F.prototype = constructor.prototype;
				    return new F();
				});
				break;
			case 'singleton':
			default:
				return this.to();
			}
		};
	}
	
	/**
	 * Container for configuration of the knit instance
	 */
	function Config (knit) {
		var _config = {};
		this.add = function (k,v) { _config[k]=v; return v; };
		this.get = function (k) {
			var x = _config[k];
			if (typeof x === 'undefined' && k !== '') x = this.add(k, require(k));
			if (x instanceof Binder) return x.get();
			else return x;
		};
		this.parse = function (conf) {
			switch (typeof conf) {
			case 'string':
				// find a file to load js or json
				break;
			case 'function': 
				var that = this;
				conf(function (k) {
					switch (typeof k) {
					case 'string':
						return that.add(k, new Binder(knit));
					case 'function':
						var b = new Binder(knit);
						scan_fun(k, function(_0,_1,_2) { if (_1.length>0) that.add(_1,b.to(k)); else b=undefined; });
						return b;
					default:
					}
				});
				break;
			case 'object':			
				for (var k in conf) this.add(k, conf[k]);
				break;
			}
		};
	};
	
	/**
	 * Exported as singleton
	 */
	function Knit() {
		var config = new Config(this);
		this.config = function(conf) {
			config.parse(conf);
			return this;
		};
		this.inject = function(cb, asThis, into) {
			var required = [];
			scan_fun(cb,function (_0,_1,_2) {
				_2.split(/\s*,\s*/).forEach(function(e) { required.push(e); });
			});	
			var arg = [];
			required.forEach(function (e) { arg.push(config.get(e)); });
			var res;
			if (typeof into === 'function') res = into(cb,arg);
			else res = cb.apply(null,arg);
			if (!!asThis) return this;
			return res;
		};
		this.clean = function(arr) {
			if (typeof arr === 'object' && arr instanceof Array) {			
				arr.forEach(function(u) {delete options[u];});
			} else {
				for (u in options) delete options[u];
			}
			return this;
		};
		this.clone = function(x) {
			// basic clone, this do not work in every case :(
			return JSON.parse(JSON.stringify(x));
		};
	}
	/**
	 * Singleton export of Knit
	 */
	publish(new Knit());

})
(/**
 * The publish method that detects 
 */		
function (knit) {
	if (typeof module !== 'undefined') {
		module.exports = knit;
	} else {
		this['knit']=knit;
	}
},
/**
 * 
 */
typeof require !== 'undefined' ? require : function(k) { return this['knit']; }
);