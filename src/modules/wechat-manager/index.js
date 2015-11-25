var VManager = require('./wechat-manager');

module.exports = function(capacity){
    var vManager = new VManager({
        capacity: capacity
    });
    return vManager;
};