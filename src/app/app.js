var cluster = require('cluster');
var path = require('path');
var numCPUs = require('os').cpus.length;
var wechatManagerFactory = require('../modules/wechat-manager/wechat-manager');
var net = require('net');
var getBroker = require('../modules/wechat-broker')
var managerSettings = require('../modules/wechat-manager/wechat-manager-settings');
var settings = require('./settings');
var app = require('./Application')();

app.registerService(settings.services.RABBITMQ);

//init broker
require('../modules/wechat-broker')(app);

//init cluster
cluster.setupMaster({
    exec: path.join(__dirname, '../modules/wechat-agent/wechat-agent-builder.js'),
    args: ['--harmony']
});

//handle uncaughtException to protect process
process.on('uncaughtException', function(err){ console.error(err.stack); });

app.start(callback);

//app is startup
function callback(){
    console.info('[system]: system is startup');
    //create a master process, connection never end
    var server = net.createServer(function(socket) {});
    server.listen(3000);

    //build wechat manager
    wechatManager = wechatManagerFactory({
        id: 'test',
        payloadNum: numCPUs
    });

    //bind vc event listener
    getBroker().then(function(broker){
        //continue to heartbeat
        setInterval(function(){
            broker.brokerManager.heartbeat({
                CreateTime: (new Date()).getTime(),
                NodeId: wechatManager.id
            });
        }, managerSettings.heartbeatGap);

        /**
         *  msg: {
         *      CreateTime: Number: Date#getTime() milliseconds
         *      NodeId: String
         *      OldStatus: String  reference: 'started' | 'stopped' | 'interrupted'
         *      NewStatus: String
         *  }
         */
        process.on('exit', function(){
            broker.brokerManager.statusChange({
                CreateTime: new Date(),
                NodeId: wechatManager.id,
                OldStatus: 'started',
                NewStatus: 'stopped'
            })
        });

        /**
         *  msg: {
         *      CreateTime: Number: Date#getTime() milliseconds
         *      NodeId: String
         *      RAM: String
         *      CPU: String
         *      ExceptedAgentSum: 预计
         *      ActualAgentSum: 实际
         *  }
         */
        broker.brokerManager.onStatusRequest(function(err, data){
            if(data.NodeId === wechatManager.id){
                console.log('[system]: receive a status request event');
                broker.brokerManager.statusResponse({
                    CreateTime: new Date(),
                    NodeId: wechatManager.id,
                    RAM: require('../modules/wechat-manager/helper/getRAMUsage')(),
                    CPU: 0,
                    IP: require('../modules/wechat-manager/helper/getIPInfo')(),
                    ExceptedAgentSum: require('os').cpus().length,
                    ActualAgentSum: wechatManager.getAllWorkers().length || 0
                });
            }
        });
        /**
         *  msg: {
         *      CreateTime: Number: Date#getTime() milliseconds
         *      NodeId: String
         *      AgentId: String
         *      Intention: String 'register' | 'login'
         *      Mode: 'trusted' | 'untrusted'
         *      Nickname: String  ONLY applicable if Mode is untrusted
         *      Sex: 0 1 2        ONLY applicable if Mode is untrusted
         *      Region:           ONLY applicable if Mode is untrusted
         *  }
         */
        broker.brokerAgent.onStartRequest(function(err, data){
            if(data.NodeId === wechatManager.id){
                wechatManager.spawnWorker({
                    id: data.AgentId,
                    managerId: data.NodeId,
                    intention: data.Intention,
                    mode: data.Mode,
                    nickname:data.Nickname,
                    sex: data.Sex,
                    region: data.Region
                });
            }
        });
    });
}

