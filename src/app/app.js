//var VC = require('vc');
//var client = require('../../app/redis-client');
//var vc = new VC(client);

module.exports = function(processRegistry){
    var numCPUs = require('os').cpus.length;
    var vManager = require('../modules/wechat-manager/index')(numCPUs);
    //vManager.on('message', function(channel, message){
    //
    //});
    vManager.start();
};
