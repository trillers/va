//var VC = require('vc');
//var client = require('../../app/redis-client');
//var vc = new VC(client);
var cluster = require('cluster');
var path = require('path');
var numCPUs = require('os').cpus.length;
var wechatManagerFactory = require('../modules/wechat-manager/wechat-manager');

cluster.setupMaster({
    exec: path.join(__dirname, '../modules/wechat-agent/wechat-agent-builder.js'),
    args: ['--harmony']
});

wechatManager = wechatManagerFactory(numCPUs);
setTimeout(function(){
    wechatManager.heartbeat();
}, 3000)

//bind wechat manager message event
wechatManager.start();
