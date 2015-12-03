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
 * @param {..*}    var_args Any arguments to pass to the function
 * @param {Function} callback
 */
Macros.prototype.scheduleMacros = function(executor, context, var_args, callback){
    var me = this,
        args = [].slice.call(arguments),
        cb = args[args.length-1],
        len = arguments.length;
    if(len < 3 || (typeof cb != "function")){
        throw new Error('input illegal when schedule a macros');
    }
    var rem = args.slice(2, len-1);
    executor.apply(context || null, rem.concat([function(e, data){
        if(e){
            if(me._cmdStack.length){
                return me.undo().then(function(){
                    cb(e);
                })
                .thenCatch(function(e){
                    console.error('Failed to execute undo of macros');
                    console.log(e)
                    cb(e)
                })
            }
            cb(e);
        } else {
            cb(null)
        }
    }]))
};

/**
 * undo all commands in commands stack
 * @returns {!promise.Promise.<!Array.<T>>|boolean|Promise|*|!goog.Promise.<!Array.<TYPE>>}
 */
Macros.prototype.undo = function(){
    var undos = [];
    this._cmdStack.forEach(function(cmd){
        if(cmd.undo && cmd.undo.args){
            undos.push(cmd.undo.method.apply(null, cmd.undo.args));
        }
        else{
            return undos.push(cmd.undo.method());
        }
    });
    return webdriver.promise.all(undos)
};

/**
 * commandify function
 * @param {Function}    executor
 * @param {WebDriver}   driver
 * @param {Function}    undo
 * @param               opt_exArgs
 * @param               opt_unArgs
 * @returns {*}
 */
Macros.prototype.scheduleCommand = function(executor, driver, undo, opt_exArgs, opt_unArgs){
    var args = [].slice.call(arguments),
        me = this;
    var exArgs = args[3] || null;
    var unArgs = args[4] || null;

    validateInput(executor, undo, driver);

    function validateInput(){
        if(arguments.length < 3) {
            throw new Error('input illegal when schedule a command')
        }
        if(typeof executor !== 'function') {
            throw new Error('input illegal when schedule a command: executor -param1 must be a function')
        }
        if(typeof undo !== 'function'){
            throw new Error('input illegal when schedule a command: undo -param2 must be a function')
        }
        if(!(driver instanceof webdriver.WebDriver)){
            throw new Error('input illegal when schedule a command: driver -param3 must be a instance of WebDriver')
        }
        if(exArgs && !(Array.isArray(exArgs))){
            throw new Error('input illegal when schedule a command: executor args must be a array')
        }
        if(unArgs && !(Array.isArray(unArgs))){
            throw new Error('input illegal when schedule a command: undo args must be a array')
        }
    }

    var command = {
        executor: executor,
        undo: {
            method: undo,
            args: unArgs
        }
    };
    driver.controlFlow().execute(function(){
        me._cmdStack.push(command);
    });
    if(!exArgs.length){
        return driver.call(executor, driver);
    }
    return driver.controlFlow().execute(function(){
        return executor.apply(driver, exArgs);
    });
};

module.exports =  function(){
    return new Macros();
};