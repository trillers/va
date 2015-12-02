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
    console.log(getBroker());
    worker = agentFactory(args.workerJson);
    //register external event listener
    getBroker().then(function(broker){
        //init agent broker
        broker.brokerAgent.init(worker.id);

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


    });
    //TODO check status
    worker.start(args.options, function(err){
        if(err){
            console.error("[system]: Failed to start worker id=" + args.workerJson.id)
        }
        console.log("[system]: agent is started up id=" + args.workerJson.id);
        worker.onNeedLogin(function(err, data){
            if(err){
                console.info('[system]: Failed to login');
                return;
            }
            getBroker().then(function(broker){

            })
        });
    });
}

function stopHandler(){

}