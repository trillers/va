var net = require('net');
var agentFactory = require('./wechat-agent');
var server = net.createServer(function(socket) {});
var worker = null;
var settings = require('./wechat-agent-settings');
var getBroker = require('../wechat-broker');

//connections never end
server.listen(8000);

//def ipc channel
var ipcChannel = {};

ipcChannel['start'] = startHandler;
ipcChannel['stop'] = stopHandler;

process.on('message', function(cmd) {
    ipcChannel[cmd.method].apply(null, [cmd.args])
});

//def how to handle event from ipc
function startHandler(args){
    console.log("@@@@@@@@@@@@")
    console.log(args);
    worker = agentFactory(args.workerJson);
    //TODO check status
    worker.start(args.options, function(err){
        if(err){
            console.error("[system]: Failed to start worker id=" + args.workerJson.id)
        }
        console.log("[system]: agent is started up id=" + args.workerJson.id);
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
        getBroker().then(function(broker){

            broker.brokerAgent.init(worker.id);

            setInterval(function(){
                broker.brokerAgent.heartbeat({
                    CreateTime: (new Date()).getTime(),
                    AgentStatus: worker.status,
                    PId: worker.pid,
                    AgentId: worker.id,
                    NodeId: worker.managerId
                });
            }, settings.heartbeatGap);

            broker.brokerAgent.onActionOut(function(err, data, msg){
                worker[actionsMap[data.Action]](function(err, result){
                    broker.brokerAgent.actionFeedback(result);
                    broker.brokerAgent.finish(msg);
                })
            }, worker.id);

            worker.onNeedLogin(function(err, data){
                if(!err){
                    broker.brokerAgent.actionIn(data);
                }
            });

            worker.onReceive(function(err, data){
                if(!err){
                    broker.brokerAgent.actionIn(data);
                }
            })
        });
    });
}

function stopHandler(){

}