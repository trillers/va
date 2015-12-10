var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
var worker = null;
var settings = require('./wechat-agent-settings');
var getBroker = require('../wechat-broker');
var co = require('co');

//connections never end
server.listen(8000);

//def ipc channel
var ipcChannel = {};

ipcChannel['start'] = startHandler;
ipcChannel['stop'] = stopHandler;

process.on('message', function(cmd) {
    co(function*(){
        yield ipcChannel[cmd.method].apply(null, [cmd.args]);
    })
});

//def how to handle event from ipc
function* startHandler(args){
    worker = agentFactory(args.workerJson);
    var actionsMap = {
        'send-txt-contact': 'sendText',
        'send-img-contact': 'sendImage',
        'send-txt-group': 'sendText',
        'send-img-group': 'sendImage',
        'profile-request': 'readProfile',
        'sync-groups': 'groupList',
        'sync-contacts': 'contactList',
        'polling-list': 'walkChatList'
    };
    //def action response
    var broker = yield getBroker();

    setInterval(function(){
        broker.brokerAgent.heartbeat({
            CreateTime: (new Date()).getTime(),
            AgentStatus: worker.status,
            PId: worker.pid,
            AgentId: worker.id,
            NodeId: worker.managerId
        });
    }, settings.heartbeatGap);

    worker.onNeedLogin(function(err, data){
        if(!err){
            var msg = {
                CreateTime: (new Date()).getTime(),
                Action: 'need-login',
                AgentId: data.botid,
                MediaUrl: data.mediaUrl
            };
            console.log(msg);
            broker.brokerAgent.actionIn(msg);
        }
    });

    worker.onFirstProfile(function(err, data){
        if(!err){
            var msg = {
                CreateTime: (new Date()).getTime(),
                Action: 'first-profile',
                AgentId: worker.id,
                Profile: data
            };
            console.log(msg);
            broker.brokerAgent.actionIn(msg);
        }
    });

    worker.onLogin(function(err, data){
        if(!err){
            var msg = {
                CreateTime: (new Date()).getTime(),
                Action: 'login',
                AgentId: data.botid
            };
            console.log(msg);
            broker.brokerAgent.actionIn(msg);
        }
    });

    worker.onReceive(function(err, data){
        if(!err){
            broker.brokerAgent.actionIn(data);
        }
    });
    worker.withDriver();
    worker.start(args.options, function(err){
        if(err){
            console.error("[system]: Failed to start worker id=" + args.workerJson.id);
            console.error(err);
            return;
        }
        //TODO begin to polling
        console.log("[system]: agent is logged in, begin to polling id=" + args.workerJson.id);
        broker.brokerAgent.init(worker.id);
        broker.brokerAgent.readyToPolling({
            CreateTime: (new Date()).getTime(),
            Command: 'started',
            AgentId: worker.id,
            Took: 0,
            Code: 200,
            Desc: ''
        });
        broker.brokerAgent.onActionOut(function(err, data, msg){
            worker[actionsMap[data.Action]](function(err, result){
                broker.brokerAgent.finish(msg);
                broker.brokerAgent.actionFeedback(result);
            })
        }, worker.id);
    });
}

function stopHandler(){
    //TODO
}