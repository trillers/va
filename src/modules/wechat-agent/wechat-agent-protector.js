var broker = require('../wechat-broker');
var CONST = require('./settings/constant');

module.exports = function(worker){
    return function(err){
        if(err.code){
            setTimeout(function(){
                worker = null;
                process.exit();
            }, 2000);
            console.error('[system]: normal error occur');
        }
        else{
            console.error('[system]: native error occur');
        }
        console.error(err.message);
        console.error(err.stack);
    }
};

