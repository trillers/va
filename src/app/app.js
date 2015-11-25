var VCR = require('vcr');
var channels = require('vcr').channels;
var pubClient = require('../../app/redis-client')('pub');
var subClient = require('../../app/redis-client')('sub');
var vcr = new VCR(pubClient, subClient);
var cluster = require('cluster');
var path = require('path');
var numCPUs = require('os').cpus.length;
var wechatManagerFactory = require('../modules/wechat-manager/wechat-manager');

vcr.channels = channels;

cluster.setupMaster({
    exec: path.join(__dirname, '../modules/wechat-agent/wechat-agent-builder.js'),
    args: ['--harmony']
});

wechatManager = wechatManagerFactory({
    payloadNum: numCPUs,
    vcr: vcr});

setTimeout(function(){
    wechatManager.heartbeat();
}, 3000)

//bind wechat manager message event
wechatManager.start();
