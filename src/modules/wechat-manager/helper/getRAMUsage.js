var os = require('os');

module.exports = function(){
    return ((os.totalmem()-os.freemem())/os.totalmem()*100).toFixed(2);
};