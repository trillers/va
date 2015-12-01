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

//register external event listener
getBroker().then(function(broker){
     /*  msg: {
      *      CreateTime: Number: Date#getTime() milliseconds
      *      NodeId: String
      *      AgentId: String
      *      AgentStatus:
      *       - starting
      *       - logging
      *       - mislogged
      *       - logged
      *       - exceptional
      *       - aborted
      *       - exited
      *  }
      */
    setInterval(function(){
        broker.brokerAgent.heartbeat({
            CreateTime: (new Date()).getTime(),
            AgentStatus: worker.getStatus(),
            PId: worker.pid,
            AgentId: worker.id,
            NodeId: worker.managerId
        });
    }, settings.heartbeatGap);

    /**
     *  msg: {
         *      CreateTime: Number: Date#getTime() milliseconds
         *      NodeId: String
         *      AgentId: String
         *  }
     */
    broker.brokerAgent.onStatusRequest(function(data){
        if(data.NodeId === worker.managerId && data.AgentId === worker.id){
        /**
         *  msg: {
         *      CreateTime: Number: Date#getTime() milliseconds
         *      NodeId: String
         *      AgentId: String
         *      AgentStatus: String
         *       - starting
         *       - logging
         *       - mislogged
         *       - logged
         *       - exceptional
         *       - aborted
         *       - exited
         *  }
         */
            broker.brokerAgent.statusResponse({
                CreateTime: (new Date()).getTime(),
                NodeId: worker.managerId,
                AgentId: worker.id,
                AgentStatus: worker.getStatus()
            })
        }
    });

    /**
     *  msg: {
         *      CreateTime: Number: Date#getTime() milliseconds
         *      NodeId: String
         *      AgentId: String
         *  }
     */
    broker.brokerAgent.onProfileRequest(function(){
        if(data.NodeId === worker.managerId && data.AgentId === worker.id){
            /**
             *  msg: {
             *      CreateTime: Number: Date#getTime() milliseconds
             *      NodeId: String
             *      AgentId: String
             *      OriginalHeadImgUrl: original head image url when we request profile
             *      HeadImgId: ?
             *      Nickname: String
             *      Sex: 0 1 2
             *      Region:
             *  }
             */
            if(!worker.status.indexOf['login']){
                broker.brokerAgent.profileResponse({
                    err: {
                        code: 404,
                        message: '[system]: operation failed, the worker works abnormal'
                    }
                });
                return;
            }
            worker.profileRequest(function(data){
                broker.brokerAgent.profileResponse({
                    CreateTime: (new Date()).getTime(),
                    NodeId: worker.managerId,
                    AgentId: worker.id,
                    OriginalHeadImgUrl: data.headImgUrl,
                    Nickname: data.nickname,
                    Sex: data.sex,
                    Region: data.place
                })
            })
        }
    })

});

//def how to handle event from ipc
function startHandler(args){
    worker = agentFactory(args.workerJson);
    //TODO check status
    worker.start(args.options, function(){
        console.log("[system]: agent is started up id=" + args.workerJson.id);
    });
}

function stopHandler(){

}