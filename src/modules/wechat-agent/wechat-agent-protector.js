var broker = require('../wechat-broker');
var STATUS = require('./settings/constant').STATUS;
var MYERROR = require('./settings/myerror');

module.exports = function(agent){
    return function(err){
        if(err.code){
            if(fatelErrorFilter(err)){
                agent.stop()
                    .then(function(){
                        done();
                    })
                    .catch(function(){
                        done();
                    });
                return;
            }
            function done(){
                if([STATUS.ABORTED, STATUS.MISLOGGED, STATUS.EXITED].indexOf(agent.status) < 0){
                    agent.transition(STATUS.ABORTED);
                }
                setTimeout(function(){
                    agent = null;
                    process.exit();
                }, 2000);
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

