var VCR = require('vcr');
var channels = require('vcr').channels;
var pubClient = require('../../src/app/redis-client')('pub');
var subClient = require('../../src/app/redis-client')('sub');
var vcrOrigin = VCR(pubClient, subClient);
var cluster = require('cluster');
var path = require('path');
var numCPUs = require('os').cpus.length;
var wechatManagerFactory = require('../modules/wechat-manager/wechat-manager');

vcrOrigin.channels = channels;

//init cluster
cluster.setupMaster({
    exec: path.join(__dirname, '../modules/wechat-agent/wechat-agent-builder.js'),
    args: ['--harmony']
});

//build wechat manager
wechatManager = wechatManagerFactory({
    id: 'test',
    payloadNum: numCPUs,
    vcr: vcrOrigin
});

//do some test
setTimeout(function(){
    //vb
    vcrOrigin.onHeartBeatResponse('test', function(data){
        console.log('manager status ***************');
        console.log(data);
    });
    vcrOrigin.onAgentHeartBeatResponse('test', function(data){
        console.log('agent status *****************');
        console.log(data)
    });
    //va
    vcrOrigin.onHeartBeatRequest('test', function(data){
        var bid = data.bid;
        if(bid === wechatManager.id){
            //send heartbeat message to vb
            setInterval(function(){
                vcrOrigin.heartBeatResponse({bid: wechatManager.id, status: wechatManager.status})
            }, 3000);
        }
    });
    vcrOrigin.onAgentHeartBeatRequest('test', function(data){
        var bid = data.bid;
        if(bid === wechatManager.id){
            //send heartbeat message to vb
            setInterval(function(){
                wechatManager.heartbeat();
            }, 3000);
        }
    });
    //vb subscribe
    vcrOrigin.agentHeartBeatRequest('test');
    vcrOrigin.heartBeatRequest('test');
}, 3000);

wechatManager.spawnWorker('test');

