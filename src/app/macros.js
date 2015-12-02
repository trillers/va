var webdriver = require('selenium-webdriver');

/**
 * macros commander base on WebDriver
 * allow node style executor only
 * @constructor
 */
function Macros(){
    this._cmdStack = [];
}

/**
 * macrosify a executor
 * @param {Function} executor
 * @param {Object}   context
 * @param {...}      args
 * @param {Function} callback
 */
Macros.prototype.scheduleMacros = function(){
    var me = this,
        args = [].slice.call(arguments),
        cb = args[args.length-1],
        len = args.length;
    if(len < 3 || (typeof cb != "function")){
        throw new Error('input illegal');
    }
    var executor = args.slice(0, 1)[0],
        context = args.slice(1, 2)[0],
        rem = args.slice(2, len-1);
    executor.apply(context || null, rem.concat([function(e, data){
        if(e){
            if(me._cmdStack.length){
                return me.undo().then(function(){
                    cb(e);
                })
            }
            cb(e);
        }
        cb(null)
    }]))
};

/**
 * undo all commands in commands stack
 * @returns {!promise.Promise.<!Array.<T>>|boolean|Promise|*|!goog.Promise.<!Array.<TYPE>>}
 */
Macros.prototype.undo = function(){
    var undos = [];
    this._cmdStack.forEach(function(cmd){
        undos.push(cmd.undo())
    });
    return webdriver.promise.all(undos)
};

/**
 * commandify function
 * @param {Function}    executor
 * @param {WebDriver}   driver
 * @param {Function}    undo
 * @param {...}         args
 * @returns {*}
 */
Macros.prototype.scheduleCommand = function(){
    var args = [].slice.call(arguments),
        executor = args[0],
        undo = args[2],
        driver = args[1],
        rem = args.slice(2),
        res = "",
        me = this;
    var command = {
        executor: executor,
        undo: undo
    };
    driver.controlFlow().execute(function(){
        me._cmdStack.push(command);
    });
    if(!rem.length){
        return driver.call(executor, undo);
    }
    rem.forEach(function(arg){
        res += arg + ',';
    });
    return eval("driver.call(executor, undo, " + res.substr(0, res.length-1) + ")")
};

module.exports =  function(){
    return new Macros();
};