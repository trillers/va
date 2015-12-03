var util = {};
util.typeof = function(a){
    var b = typeof a;
    if(typeof a === 'object'){
        if (a) {
            if (a instanceof Array) {
                return "array";
            }
            if (a instanceof Object) {
                return b;
            }
            var c = Object.prototype.toString.call(a);
            if ("[object Window]" == c) {
                return "object";
            }
            if ("[object Array]" == c || "number" == typeof a.length && "undefined" != typeof a.splice && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("splice")) {
                return "array";
            }
            if ("[object Function]" == c || "undefined" != typeof a.call && "undefined" != typeof a.propertyIsEnumerable && !a.propertyIsEnumerable("call")) {
                return "function";
            }
        } else {
            return "null";
        }
    } else {
        if ("function" == b && "undefined" == typeof a.call) {
            return "object";
        }
    }
    return b;
};
util.mixin = function(a, b) {
    for (var c in b) {
        a[c] = b[c];
    }
};
util.deepMixin = function(a, b) {
    for (var c in b) {
        var d = util.typeof(b[c]);
        if('object' === d || 'array' === d){
            a[c] = {};
            util.deepMixin(a[c], b[c])
        }
        a[c] = b[c]
    }
};
util.clone = function(a){
    var b = util.typeof(a);
    if('array' === b || 'object' === b){
        var b = b === 'array' ? [] : {}, c;
        for (var c in a) {
            b[c] = util.clone(a[c])
        }
        return b;
    }
    return a;
};
util.deepClone = function(a){
    var b = util.typeof(a);
    if('array' === b || 'object' === b){
        var b = b === 'array' ? [] : {}, c;
        for (var c in a) {
            if(util.typeof(a[c]) === 'array' || util.typeof(a[c]) === 'object'){
                b[c] = util.clone(a[c])
            }
            b[c] = a[c];
        }
        return b;
    }
    return a;
};
util.isArray = function(a){obj
    return Array.isArray(a);
};
util.isObject = function(a){
    return util.typeof(a) === 'object'
};
util.isFunction = function(a){
    return util.typeof(a) === 'function'
};
util.isString = function(a){
    return util.typeof(a) === 'string'
};
util.isNumber = function(a){
    return util.typeof(a) === 'number'
};
util.isPromise = function(v){
    return !!v && util.isObject(v) && (util.typeof(v['then']) === 'function' )
};
util.isGenerator = function(fn) {
    return fn.constructor.name === 'GeneratorFunction';
};
util.noop = function(){};