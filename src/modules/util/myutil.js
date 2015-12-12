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
util.mixinLazy = function(a, b){
    for (var c in b) {
        if(!a.hasOwnProperty(c)){
            a[c] = b[c];
        }
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
util.objMatchRate = function(o1, o2){
    var l1 = Object.keys(o1).length,
        l2 = Object.keys(o2).length,
        l = l1 > l2 ? l1 : l2,
        i = l1 > l2 ? o2 : o1,
        a = i === o1 ? o2 : o1,
        len=0;
    for(var p in i){
        a[p] === i[p] && len++;
    }
    return parseInt(len/l*100, 10).toFixed(2);
};
util.objPick = function(o){
    var args = [].slice.call(arguments, 1);
    for(var p in o){
        if(args.indexOf(p) === -1){
            delete  o[p]
        }
    }
    return o;
};
util.objExclude = function(o){
    var args = [].slice.call(arguments, 1);
    args.forEach(function(p){
        if(p in o){
            delete o[p];
        }
    });
    return o;
};
util.isArray = function(a){
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

util.arr = {};
util.arr.remove = function(arr, o){
    arr.indexOf(o) >= 0 && arr.splice(arr.indexOf(o), 1)
};
util.arr.in = function(arr, o){
    return arr.indexOf(o) >=0;
};
util.obj = {};
util.obj.isEmpty = function(o){
    return util.typeof(o) && Object.keys(o).length<=0 || false
};
util.mapToArr = function(o){
    if(util.typeof(o) != 'object'){
        console.error('map convert to arr error');
        return;
    }
    var arr = [];
    Object.keys(o).forEach(function(key){
        arr.push(o[key]);
    });
    return arr;
};
util.noop = function(){};

module.exports = util;