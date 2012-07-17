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

// function scanning
var rx = /function\s+(\w*)\s*\((.*?)\)/
exports.scan_fun = function (fun,cb) {    	
	fun.toString().replace(rx, cb)
}

// String representation summary
exports.asString = function(v) {
	if (v == null) return 'null'
	switch (typeof v) {
	case 'undefined':
		return 'undefined'
	case 'function':
		var l = v.toString().split(/\n/)
		if (l.length>1) return l[0] + '...}'
		else return v
	default: 
		return v.toString()
	}
}

// Retrieve stacktrace element
exports.getStack = function getStack(filter) {
	filter = filter || function (r) {return r}
	var orig = Error.prepareStackTrace
	Error.prepareStackTrace = function(_, stack){ return stack }
	var err = new Error()
	Error.captureStackTrace(err, arguments.callee)
	var stack = err.stack
	Error.prepareStackTrace = orig
	return stack.map(filter)
}
