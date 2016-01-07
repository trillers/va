var cluster = require('cluster');
var path = require('path');
var wechatManagerFactory = require('../modules/wechat-manager/wechat-manager');
var net = require('net');
var getBroker = require('../modules/wechat-broker')
var managerSettings = require('../modules/wechat-manager/wechat-manager-settings');
var settings = require('./settings');
var app = require('./Application')();
var co = require('co');
require('../modules/util/codeService');

app.registerService(settings.services.RABBITMQ);

//init broker
require('../modules/wechat-broker')(app);

//init cluster
cluster.setupMaster({
    exec: path.join(__dirname, '../modules/wechat-agent/wechat-agent-builder.js'),
    args: ['--harmony']
});

//handle uncaughtException to protect process
process.on('uncaughtException', function(err){ console.error(err); });

app.start(function(){
    co(function* (){
        yield callback();
    })
});

//app is startup
function* callback(){
    try {
        console.info('[system]: system is startup');
        //create a master process, connection never end
        var server = net.createServer(function (socket) {
        });
        server.listen();
        //build wechat manager
        wechatManager = wechatManagerFactory({
            id: settings.id,
            exceptedAgentSum: settings.max_load
        });

        //bind vc event listener
        var broker = yield getBroker();
        wechatManager.broker = broker.agentManager;
        //agent manager broker init
        broker.agentManager.init(wechatManager.id);

        //am is started
        broker.agentManager.statusChange({
            CreateTime: new Date(),
            NodeId: wechatManager.id,
            OldStatus: 'stopped',
            NewStatus: 'started'
        });

        //continue to heartbeat
        setInterval(function () {
            broker.agentManager.heartbeat({
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
        process.on('exit', function () {
            broker.agentManager.statusChange({
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
        broker.agentManager.onInfoRequest(function (err, data) {
            console.log('[system]: receive a status request event');
            broker.agentManager.infoResponse({
                CreateTime: (new Date()).getTime(),
                NodeId: wechatManager.id,
                RAM: require('../modules/wechat-manager/helper/getRAMUsage')(),
                CPU: 0,
                //IP: require('../modules/wechat-manager/helper/getIPInfo')(),
                ExceptedAgentSum: require('os').cpus().length,
                ActualAgentSum: wechatManager.getAllWorkers().length || 0
            });
        }, wechatManager.id);

        /**
         *  Message routing: node ---> am
         *
         *  msg: {
     *      CreateTime: Number: Date#getTime() milliseconds
     *      NodeId: String
     *      AgentId: String
     *      Command: 'start'
     *      Intention: String 'register' | 'login'
     *      Mode: 'trusted' | 'untrusted'
     *      Nickname: String  ONLY applicable if Mode is untrusted
     *      Sex: 0 1 2        ONLY applicable if Mode is untrusted
     *      Region:           ONLY applicable if Mode is untrusted
     *  }
         *
         *  msg: {
     *      CreateTime: Number: Date#getTime() milliseconds
     *      NodeId: String
     *      AgentId: String
     *      Command: 'stop'
     *      Mode: 'graceful' | 'ungraceful'
     *          graceful means stop until all action messages,
     *          ungraceful means stop it right now whatever unhandled action messages there.
     *  }
         *
         *  msg: {
     *      CreateTime: Number: Date#getTime() milliseconds
     *      NodeId: String
     *      AgentId: String
     *      Command: 'reload'
     *      Mode: 'graceful' | 'ungraceful'
     *          graceful means reload until all action messages,
     *          ungraceful means reload it right now whatever unhandled action messages there.
     *  }
         *
         */
        broker.agentManager.onCommand(function (err, data) {
            if (data.Command === 'start') {
                var agent = {
                    id: data.AgentId,
                    managerId: data.NodeId,
                    intention: data.Intention,
                    mode: data.Mode,
                    nickname: data.Nickname,
                    sex: data.Sex,
                    region: data.Region
                };
                if(data.Cookies) agent.j = data.Cookies;
                wechatManager.spawnWorker(agent);
            }
            if (data.Command === 'stop') {
                console.log('receive a stop command from vn, agent id is ' + data.AgentId);
                wechatManager.stop(data.AgentId, function(e){
                    if(e){
                        var msg = {
                            NewStatus: 'exited',
                            CreateTime: (new Date()).getTime(),
                            AgentId: data.AgentId,
                            NodeId: wechatManager.id
                        };
                        broker.agent.agentStatusChange(msg);
                        broker.agent.botStatusChange(msg);
                    }
                });
            }
            if (data.Command === 'restart') {
                wechatManager.restart(data.AgentId);
            }
        }, wechatManager.id);
    }catch(e){
        console.error(e)
    }
}

