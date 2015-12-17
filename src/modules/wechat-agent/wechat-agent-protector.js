var broker = require('../wechat-broker');

module.exports = function(worker){
    return function(err){
        if(err.code){
            worker.transition(STATUS.ABORTED);
            setTimeout(function(){
                worker = null;
                process.exit();
            }, 2000);
        }
        else{
            console.error('[system]: unknown error occur.');
        }
        console.error(err.message);
        console.error(err.stack);
    }
};

