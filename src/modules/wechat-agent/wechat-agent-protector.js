var broker = require('../wechat-broker');
var STATUS = require('./settings/constant').STATUS;
var MYERROR = require('./settings/myerror');

module.exports = function(worker){
    return function(err){
        if(err.code){
            if(fatelErrorFilter(err)){
                worker.stop().then(function(){
                    worker.transition(STATUS.ABORTED);
                    setTimeout(function(){
                        worker = null;
                        process.exit();
                    }, 2000);
                }).catch(function(){
                    worker.transition(STATUS.ABORTED);
                    setTimeout(function(){
                        worker = null;
                        process.exit();
                    }, 2000);
                })
                return;
            }
        }
        else{
            console.error('[system]: unknown error occur.');
        }
        console.error(err.message);
        console.error(err.stack);
    }
};

function fatelErrorFilter(err){
    var result = false;
    Object.keys(MYERROR)
        .filter(function(currErr){
            return MYERROR[currErr].level == 3
        })
        .forEach(function(key){
            if(MYERROR[key].code == err.code){
                result =  true;
            }
        });
    return result;
}

